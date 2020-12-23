

import { electionRemote, iohttp, Settings } from './services';
declare const window: any;

try {

    process.on('uncaughtException', error => {
        handleError('Unhandled Error', error);
    });
    process.on('unhandledRejection', error => {
        handleError('Unhandled Promise Rejection', error);
    });

    window.addEventListener('unhandledrejection', (evt: { reason: Error }) => handleError('Unhandled Promise Rejection', evt.reason));

    window.addEventListener('error', (errorEvent: ErrorEvent) => {
        handleError('Unhandled Error', errorEvent.error);
    });

    const crashReporter: Electron.CrashReporter = window.require('electron').crashReporter;
    const { "common.app": app, "common.host": host } = Settings.getAppSettings();
    const appVer = electionRemote.getAppVersion();

    crashReporter.start({
        companyName: 'ubetia', productName: 'ubetia',
        submitURL: `http://betting.ubetia.net:8081`,
        extra: { app, ver: appVer, server: host === 'betting.ubetia.net' ? 'live server' : 'test server' }
    });

} catch (error) {
    window.alert(error.message || 'error');
}

const handleError = (type: string, error: Error) => {
    try {
        const flatError = { type, message: error.message || error, stack: error.stack };

        electionRemote.log('global', flatError, 'error');
        iohttp.post('/log/error', false, flatError);
    } catch (error) {
        window.alert(error.message || 'error');
    }
};
