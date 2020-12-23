
//@ts-check
const { BrowserWindow } = require('electron');
const { Updater } = require('./updater');
const { getAppVersion, getAppSettings } = require('./context');
const path = require('path');
const url = require('url');

const checkInterval = 10 * 60 * 1000;
/**
 * @type {Electron.BrowserWindow}
 */
let updateWindow = null;
const startUpdateMonitor = () => {
    //only available for window platform
    if (process.platform !== 'win32') return;

    const { 'common.host': host, 'common.port': port } = getAppSettings();
    const updater = new Updater(host, port + 1);

    const { browserWin } = require('./config');

    updater.on('update-available', ({ file, ver: nextver }) => {
        updateWindow && updateWindow.close();

        updateWindow = new BrowserWindow({
            ...browserWin,
            width: browserWin.width * 0.8,
            height: 250,
            minimizable: false,
            maximizable: false,
            closable: true,
            resizable: false
        });
        updateWindow.on('closed', () => {
            updateWindow = null;
        });
        updateWindow.on('blur', () => {
            updateWindow && updateWindow.focus();
        });

        const curVer = getAppVersion();

        const startUrl = url.format({
            pathname: process.env.ELECTRON_ENV === 'development' ?
                path.join(__dirname, `../public/version.html`) : path.join(process.resourcesPath, `build/version.html`),
            protocol: 'file:',
            slashes: true,
            search: `curver=${curVer}&nextver=${nextver}`
        });

        updateWindow.loadURL(startUrl);
        updateWindow.webContents.once('dom-ready', () => {
            updater.downloadUpdate(file, nextver);
        });


    });

    updater.on('download-progress', (totalBytes, bytesDone, percent) => {
        updateWindow && updateWindow.webContents.send('message', { msg_type: 'download_progress', perc: percent, bytesDone, totalBytes });
    });

    updater.on('downloaded', (file, verNo) => {
        setTimeout(() => {
            updateWindow && updateWindow.webContents.send('message', { msg_type: 'quitAndPatch' });
            updater.quitAndPatch(file, verNo);
        }, 1000);
    });

    updater.on('update-failure', (err) => {
        updateWindow && updateWindow.webContents.send('message', { msg_type: 'error', msg: 'update failure ' + err });
    });

    updater.checkForUpdate();

    setTimeout(async function checkUpate() {
        await updater.checkForUpdate();
        setTimeout(checkUpate, checkInterval);
    }, checkInterval);
};

startUpdateMonitor();