const path = require('path');
const fs = require('fs-extra');
const Zip = require('adm-zip');
const JavaScriptObfuscator = require('javascript-obfuscator');

exports.default = context => {
    const APP_NAME = context.packager.appInfo.productFilename;
    const APP_OUT_DIR = context.appOutDir;
    const PLATFORM = context.packager.platform.name;
    const srcResDir = path.join(`${APP_OUT_DIR}`, `/Resources`);
    console.log({ APP_NAME, APP_OUT_DIR, PLATFORM, cwd: srcResDir });

    if (PLATFORM === 'mac') {
        return;
    }

    const packEnvFile = path.join(__dirname, 'afterpack.json');
    const packEnv = fs.readJSONSync(packEnvFile);

    const destDir = path.join(`${APP_OUT_DIR}`, `../releases/${packEnv.version}`);

    fs.removeSync(destDir);
    fs.ensureDirSync(destDir);

    for (const role of ['admin', 'betplayer', 'scrapper']) {
        const destAppDir = path.join(destDir, role);
        const destAppResDir = path.join(destAppDir, `resources`);

        fs.ensureDirSync(destAppDir);

        fs.copySync(srcResDir, destAppResDir, {
            filter: (src, dest) => {
                if (src.endsWith('electron.asar') || src.endsWith('app.asar')) {
                    if (packEnv.includeAsar) return true;
                    console.log(`${role}:skip file copy:${src}`);
                    return false;
                }
                if (src.endsWith('user-settings.json')) {
                    console.log(`${role}:skip file copy:${src}`)
                    return false;
                }
                return true;
            }
        });

        if (packEnv.extraFiles && Array.isArray(packEnv.extraFiles)) {
            for (const file of packEnv.extraFiles) {
                const srcFilePath = path.join(APP_OUT_DIR, file);
                const distFilePath = path.join(destAppDir, file);
                console.log('copy file', srcFilePath, distFilePath);

                fs.copyFileSync(srcFilePath, distFilePath);
            }
        }

        //obfuscateCode
        const electronJsDir = path.join(destAppResDir, 'app.asar.unpacked', 'electron');
        const reactJsDir = path.join(destAppResDir, 'build', 'static', 'js');
        for (const curDir of [electronJsDir, reactJsDir]) {
            const jsFiles = fs.readdirSync(curDir);
            for (const file of jsFiles) {
                if (file.endsWith('.js')
                    && (curDir === electronJsDir || (curDir === reactJsDir && file.startsWith('main.')))
                ) {
                    const filePath = path.join(curDir, file);
                    const code = fs.readFileSync(filePath);
                    try {
                        const protectedCode = obfuscateCode(code);

                        fs.writeFileSync(filePath, protectedCode);
                    } catch (error) {
                        console.error(file);
                        throw error;
                    }

                }
            }
            console.log(`obfuscateCode:${curDir}`, jsFiles.join(','));
        }


        const settingFile = path.join(destAppResDir, 'settings.test.json');
        const settings = fs.readJSONSync(settingFile);
        settings['common.app'] = role;
        fs.writeJSONSync(settingFile, settings, { spaces: 4 });

        const zip = new Zip();

        const appFileOrFolders = fs.readdirSync(destAppDir, { withFileTypes: true });
        for (const fileOrFolder of appFileOrFolders) {
            if (fileOrFolder.isDirectory()) {
                zip.addLocalFolder(path.join(destAppDir, fileOrFolder.name),fileOrFolder.name);
            }
            else {
                zip.addLocalFile(path.join(destAppDir, fileOrFolder.name));
            }
        }

        zip.writeZip(path.join(destDir, `${role}-${packEnv.version}.zip`));

        const verFile = path.join(destAppResDir, 'ver.json');
        fs.writeJSONSync(verFile, { version: packEnv.version });


    }
};

const obfuscateCode = (code) => {

    const obfuscateCode = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: false,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: false,
        debugProtectionInterval: false,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        log: false,
        renameGlobals: false,
        rotateStringArray: true,
        selfDefending: true,
        stringArray: true,
        stringArrayEncoding: 'base64',
        stringArrayThreshold: 0.75,
        //has bugs. maybe fixed at next version, check github
        transformObjectKeys: false,
        unicodeEscapeSequence: false
    });
    return obfuscateCode;
}