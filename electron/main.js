
//@ts-check
const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const url = require('url');
const { getAppSettings, } = require('./context');
const Store = require('./Store');
const fs = require('fs');
const { spawn } = require('child_process');
/**
 * @type {Electron.BrowserWindow}
 */
let mainWindow;


require('./unhandledError');

const startup = () => {
  try {
    const { "common.app": appName } = getAppSettings();


    makeSingleInstance(appName);

    app.on('ready', createWindow);
    app.on('will-quit', () => {
      console.log('will-quit');
      cleanUpBeforeQuit();
    });
    app.on('window-all-closed', () => {
      console.log('window-all-closed');
      Store.set('proxies', undefined);
      if (process.platform !== 'darwin') {
        app.quit();
      }

    });

    app.on('activate', () => {
      if (mainWindow === null) {
        createWindow();
      }
    });

  } catch (err) {
    dialog.showErrorBox('Error', err.message || 'error');
  }
};


const makeSingleInstance = (appName) => {
  if (appName === 'betplayer') {

    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      app.quit();
      return;
    }

    app.on('second-instance', (event, commandLine, workingDirectory) => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
  }

}

const createWindow = () => {

  require('./menu');

  const { browserWin } = require('./config');
  mainWindow = new BrowserWindow({
    ...browserWin
  });

  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(process.resourcesPath, 'build/index.html'),
    protocol: 'file:',
    slashes: true
  });

  mainWindow.loadURL(startUrl);
  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });

  mainWindow.webContents.on('crashed', () => {
    console.log('crashed at render process');
    app.relaunch();
    app.exit(0);
  });

  require('./update-monitor');
  require('./proxy')(mainWindow);

  relaunchIfCrash();
}


const relaunchIfCrash = () => {
  if (process.platform !== 'win32') return;

  const exeFilePath = app.getPath('exe');
  const appPath = process.cwd();
  const watcherPath = path.join(appPath, 'watcher.exe');
  const updaterPath = path.join(appPath, 'patcher.exe');
  console.log({ appPath, exeFilePath, updaterPath });
  if (fs.existsSync(watcherPath)) {
    const sub = spawn(watcherPath, [exeFilePath, updaterPath], { detached: true, stdio: 'ignore' });
    sub.unref();
  }
}

const cleanUpBeforeQuit = () => {
  if (process.platform === 'win32') {
    const appPath = process.cwd();
    const watcherPath = path.join(appPath, 'watcher.exe');
    const killerPath = path.join(appPath, 'taskKiller.exe');
    if (fs.existsSync(killerPath)) {
      const sub = spawn(killerPath, [watcherPath], { detached: true, stdio: 'ignore' });
      sub.unref();
    }
  }
}


startup();
