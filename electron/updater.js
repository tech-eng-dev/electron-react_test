//@ts-check
const { app } = require("electron");
const fetch = require('node-fetch');
const { log, getAppSettings, getAppVersion } = require('./context');
const fs = require('fs');
const path = require('path');
const DecompressZip = require('decompress-zip');
const { EventEmitter } = require('events');
const { spawn } = require('child_process');

class Updater extends EventEmitter {
    constructor(host, port) {
        super();
        this.host = host;
        this.port = port;
    }

    async checkForUpdate() {
        try {
            const { 'common.app': appName } = getAppSettings();

            const appVersion = getAppVersion();

            const endpoint = `http://${this.host}:${this.port}/release/${appName}?ver=${appVersion}`;

            // @ts-ignore
            const res = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Methods': '*'
                }
            });

            const result = await res.json();
            if (result) {
                log('updater', { msg: 'update-available:' + JSON.stringify(result) });
                this.emit('update-available', result);
            }
            else
                this.emit('update-no-available');
        } catch (error) {
            console.error(error);
            log('updater', { msg: `error on checkForUpdate ${error.message}` }, 'error');
        }


    }

    async downloadUpdate(file, ver) {

        try {
            log('updater', { msg: 'start download update:' + file + ' ver:' + ver });

            const endpoint = `http://${this.host}:${this.port}/release/files/${file}`;
            // @ts-ignore
            const res = await fetch(endpoint, {
                method: 'GET',
                headers: { 'Content-Type': 'application/octet-stream' }
            });
            if (!res.ok) {
                throw new Error(`Unable to download ${file}, server returned ${res.status} ${res.statusText}`);
            }
            if (res.body == null) {
                throw new Error(`No response body ${file}`);
            }

            const totalBytes = parseInt(res.headers.get('Content-Length') || '0', 10);

            let bytesDone = 0;
            let percent = 0;

            const tempFolder = app.getPath('temp');
            const tempFile = path.join(tempFolder, Date.now() + '-' + path.basename(file));
            const writer = fs.createWriteStream(tempFile);

            res.body.on('data', chunk => {
                writer.write(Buffer.from(chunk));
                bytesDone += chunk.byteLength;
                const nextPerc = totalBytes === 0 ? 0 : Math.floor(bytesDone / totalBytes * 100);
                if ((nextPerc - percent) > 5 || nextPerc === 100) {
                    percent = nextPerc;
                    this.emit('download-progress', totalBytes, bytesDone, percent);
                }
            }).on('end', () => {
                log('updater', { msg: `downloaded ${file} to ${tempFile}` });
                this.emit('downloaded', tempFile, ver);
            });
        } catch (error) {
            log('updater', { msg: `error on downloading file ${file} ${error.message}` }, 'error');
            this.emit('update-failure', `${file} ${error.message}`);
        }
    }

    async quitAndPatch(pathFilePath, verNo) {

        const noAsar = process.noAsar;
        process.noAsar = true;
        try {
            if (!pathFilePath) return;

            if (!fs.existsSync(pathFilePath)) return;

            console.log('quitAndPatch');

            const unzipper = new DecompressZip(pathFilePath);
            const unzipTemp = path.join(app.getPath('temp'), `${Date.now()}`);


            const end = new Promise((resolve, reject) => {
                // @ts-ignore
                unzipper.on('error', (err) => {
                    reject(err);
                });

                // @ts-ignore
                unzipper.on('extract', () => {
                    resolve();
                });
                // unzipper.on('progress', function (fileIndex, fileCount) {
                //     console.log('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount);
                // });
            });
            unzipper.extract({
                path: unzipTemp,
                filter: (file) => {
                    return file.type !== "SymbolicLink";
                }
            });

            await end;

            let exeFilePath = app.getPath('exe');
            let appPath = process.cwd();
            if (process.env.ELECTRON_ENV === 'development') {
                appPath = path.join(appPath, 'test-updates');
                exeFilePath = path.join(appPath, "Ubetia.exe");
            }
            console.log({ appPath, exeFilePath, unzipTemp });

            const sub = spawn(path.join(appPath, 'patcher.exe'), [exeFilePath, unzipTemp, verNo], { detached: true });
            sub.unref();

        } catch (error) {
            this.emit('update-failure', error.message || error);
            log('updater', { msg: `applied patch error ${error.message || error}` })
        }
        finally {
            process.noAsar = noAsar;
        }
    }


}

module.exports = { Updater }