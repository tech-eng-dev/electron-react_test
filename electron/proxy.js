//@ts-check
const { app } = require('electron');
const { getUserSettings } = require('./context');
const Store = require('./Store');


/**
 * @param {Electron.BrowserWindow} window
 */
const proxySetup = (window) => {
    /**
     * key is the webcontentId
     * @type {Map<number,{proxyLoginAttempts:number}>}
     */
    const KingWebContext = new Map();
    app.on('login', (event, webContents, request, authInfo, cb) => tryProxyLogin(webContents, event, request, authInfo, cb));



    app.on('web-contents-created', (event, webContents) => {
        const id = webContents.id;
        console.debug('web-contents-created', id);

        // webContents.session.webRequest.onHeadersReceived((details, cb) => {
        //     console.debug('onHeadersReceived', { details });
        //     cb({});
        // });

        KingWebContext.set(id, { proxyLoginAttempts: 0 });

        webContents.once('destroyed', () => {
            console.debug('webContent destroyed', id);

            webContents.removeAllListeners();
            KingWebContext.delete(id);
        });

        webContents.on('did-fail-load', (event, errorCode, errorDescription, validateUrl) => {
            console.debug('webContent did-fail-load', errorCode, errorDescription, validateUrl);
            try {
                if (errorCode === -111) {
                    const context = KingWebContext.get(id);
                    if (context && context.proxyLoginAttempts > 4) {
                        window.webContents.send('webcontent-ipc', { msg: 'ProxyLoginTooMuchAttempts', webContentId: id });
                        webContents.session.setProxy({ proxyRules: '', pacScript: '', proxyBypassRules: '' }, () => { });
                    }
                }
            } catch (error) {
                console.error(error);
            }

        });
        webContents.on('did-finish-load', () => {
            console.debug('webContent did-finish-load', id);
        });


    });

    /**
     *
    * @param {Electron.webContents} webContents 
     * @param {Electron.Event} event 
     * @param {Electron.Request} request 
     * @param {Electron.AuthInfo} authInfo 
     * @param {(username:string,password:string)=>void} cb 
     */
    const tryProxyLogin = (webContents, event, request, authInfo, cb) => {
        try {
            const contentId = webContents.id;

            const {
                "user.proxies.account": proxyAccount,
                "user.proxies.turnOn": proxyTurnOn,
            } = getUserSettings();
            const { username, password } = proxyAccount || { username: null, password: null };

            console.debug('try proxy login', contentId, proxyTurnOn, authInfo);


            if (authInfo.isProxy && proxyTurnOn && username && password) {

                //temp solution about this issue
                //https://github.com/electron/electron/issues/16010
                if (!authInfo.realm) {
                    setTimeout(() => {
                        webContents.reload();
                    }, 500);
                    return;
                }

                const proxies = Store.get('proxies');
                if (proxies && proxies[contentId]) {

                    const webContext = KingWebContext.get(contentId);
                    if (webContext) {
                        webContext.proxyLoginAttempts++;
                    }
                    if (webContext.proxyLoginAttempts > 4) {
                        delete proxies[contentId];
                        Store.set('proxies', proxies);
                        return;
                    }
                    const { country, sessionId } = proxies[contentId];


                    event.preventDefault();
                    console.debug('proxy ready to login', `customer-${username}-cc-${country}-sessid-${sessionId}`);

                    cb(`customer-${username}-cc-${country}-sessid-${sessionId}-${Date.now()}`, password);


                }
            }
        } catch (error) {
            console.error(error);
        }
    }
}
module.exports = proxySetup;