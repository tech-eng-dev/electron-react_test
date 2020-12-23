//@ts-check
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { loggers } = require('./logger');
const fsExtra = require('fs-extra');
const os = require('os');

const isDev = process.env.ELECTRON_ENV === 'development';

const appFolder = isDev ? path.join(__dirname, '..') : app.getAppPath();
const resFolder = isDev ? path.join(__dirname, '../dev/resources') : process.resourcesPath;
const userSettingsFilePath = path.join(isDev ? appFolder : resFolder, 'user-settings.json');
const appSettingFilePath = path.join(
	isDev ? appFolder : resFolder,
	'settings.test.json'
);
const debugFilePath = path.join(isDev ? appFolder : resFolder, 'debug', 'debug.json');
const injectScriptPath = path.join(isDev ? appFolder : resFolder, 'inject-scripts');

fsExtra.ensureDirSync(resFolder);

const getElectronScriptFolderPath = () => {
	return __dirname;
};
const getAppVersion = () => {
	try {
		const fpath = path.join(resFolder, 'ver.json');
		if (!fs.existsSync(fpath)) return '1.0.0';

		const { version } = JSON.parse(fs.readFileSync(fpath).toString());
		return version;
	} catch (error) {
		return '1.0.0';
	}
};
const updateAppVersion = newVersion => {
	try {
		const fpath = path.join(resFolder, 'ver.json');
		fs.writeFileSync(fpath, JSON.stringify({ version: newVersion }));
	} catch (error) {}
};
let APP_SETTINGS = null;
const getAppSettings = () => {
	try {
		if (!APP_SETTINGS || isDev) {
			const appS = JSON.parse(fs.readFileSync(appSettingFilePath).toString());
			const debugSettings = { ...getDebugSettings() };
			Object.keys(debugSettings).forEach(key => {
				if (key.startsWith('user.')) {
					delete debugSettings[key];
				}
			});

			APP_SETTINGS = { ...appS, ...debugSettings };
		}
	} catch (error) {
		console.error(error);
		APP_SETTINGS = null;
	}
	return APP_SETTINGS;
};

let USERS_SETTINGS = null;
const getUserSettings = () => {
	try {
		if (!USERS_SETTINGS || isDev) {
			let us = {};
			if (fs.existsSync(userSettingsFilePath)) {
				us = JSON.parse(fs.readFileSync(userSettingsFilePath).toString());
			}
			const debugSettings = { ...getDebugSettings() };
			Object.keys(debugSettings).forEach(key => {
				if (!key.startsWith('user.')) {
					delete debugSettings[key];
				}
			});
			USERS_SETTINGS = { ...us, ...debugSettings };
		}
	} catch (error) {
		console.error(error);
		USERS_SETTINGS = null;
	}
	return USERS_SETTINGS;
};
const saveUserSettings = settings => {
	fs.writeFileSync(userSettingsFilePath, settings);
	USERS_SETTINGS = null;
};
const getInjectScriptFolderPath = () => {
	return injectScriptPath;
};

const log = (app, jMsg, level) => {
	const logger = loggers[app];
	logger && logger.log(level || 'info', { time: new Date(), ...jMsg });
};
const getDebugSettings = () => {
	if (!fs.existsSync(debugFilePath)) return {};

	return JSON.parse(fs.readFileSync(debugFilePath).toString());
};

const delimiter = '$$$';
const writeJson = (fname, jdata, flag = 'a') => {
	const filePath = path.join(resFolder, fname);
	const dataFolder = path.dirname(filePath);
	fsExtra.ensureDirSync(dataFolder);

	fs.writeFileSync(filePath, JSON.stringify(jdata) + delimiter, { flag: flag || 'a' });
};
const readJson = fname => {
	try {
		const filePath = path.join(resFolder, fname);
		const fdata = fs.readFileSync(filePath).toString();
		const lines = fdata.split(delimiter);
		const jArray = [];
		for (const line of lines) {
			try {
				jArray.push(JSON.parse(line));
			} catch (error) {}
		}
		return jArray;
	} catch (error) {
		return null;
	}
};

const exportJsonToCsv = (jArray, iname) => {
	try {
		if (!jArray || jArray.length === 0) return null;
		let csvContent = '';
		for (const key of Object.keys(jArray[0])) {
			csvContent += `"${key}",`;
		}
		csvContent += os.EOL;

		for (const item of jArray) {
			for (const key in item) {
				csvContent += `"${item[key]}",`;
			}
			csvContent += os.EOL;
		}

		const desktop = app.getPath('desktop');
		const savePath = path.join(desktop, `${iname}_${Date.now()}.csv`);
		fs.writeFileSync(savePath, csvContent);
		return savePath;
	} catch (error) {
		console.error(error);
		return null;
	}
};
const getProcessId = () => {
	return process.pid;
};
module.exports = {
	getAppSettings,
	getUserSettings,
	saveUserSettings,
	getInjectScriptFolderPath,
	getElectronScriptFolderPath,
	log,
	writeJson,
	readJson,
	getAppVersion,
	updateAppVersion,
	getDebugSettings,
	exportJsonToCsv,
	getProcessId
};
