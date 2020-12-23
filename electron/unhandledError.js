//@ts-check
const { loggers } = require('./logger');
const { dialog, crashReporter } = require('electron');
const { getAppSettings, getAppVersion } = require('./context');

const startup = () => {
    try {
        const { "common.app": appName, "common.host": host } = getAppSettings();

        const appVer = getAppVersion();

        crashReporter.start({
            companyName: 'ubetia', productName: 'ubetia',
            submitURL: `http://betting.ubetia.net:8081`,
            extra: { app: appName, ver: appVer, server: host === 'betting.ubetia.net' ? 'live server' : 'test server' }
        });

        process.on('uncaughtException', error => {
            handleError('Unhandled Error', error);
        });

        process.on('unhandledRejection', error => {
            handleError('Unhandled Promise Rejection', error);
        });

    } catch (error) {
        dialog.showErrorBox('Error', error.message || 'error');
    }
};

const handleError = (type, error) => {
    try {
        loggers['global'].error(error, { errorType: type });
        dialog.showErrorBox('Error', error.message || error);
    } catch (error) {
        dialog.showErrorBox('Error', error.message || 'error');
    }
}

startup();