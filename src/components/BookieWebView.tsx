

import React from "react";
import { electionRemote, Settings, persistent } from '../services';
import { css, StyleSheet } from 'aphrodite';
import { IOMessage, WebviewIPCMsg, WebviewContext } from "../models";
import { WebviewTag, IpcRenderer } from 'electron';
import KOBrowser from "../services/KOBrower";
import { getRandomUA } from "../services/Common";

declare const window: any;
const ipcRenderer: IpcRenderer = window.require("electron").ipcRenderer;


export interface Props {
    devToolOpen: boolean;
    src: string;
    script?: string;
    hidden?: boolean;
    session: string;
    context: WebviewContext;
    proxyCountry?: string;
    onIpcMsg?: (sender: BookieWebView, data: WebviewIPCMsg) => void;
    onURLChanged?: (url: string, inApp: Boolean) => void;
    onFinishedLoaded?: (url: string) => void;
    onDomReady?: () => void;
    onError?: (context: WebviewContext, reason: string) => void;
    willUnmount?: (context: WebviewContext) => void
    didMount?: (context: WebviewContext) => void;
}
interface State {
    webviewLoaded: boolean;
}
export default class BookieWebView extends React.PureComponent<Props, State> {


    private _koBrowser?: KOBrowser = undefined;
    private _webview?: WebviewTag = undefined;
    private _webContentId?: number = undefined;
    private ua?: string = undefined;

    componentDidUpdate(prevProps: Props) {
        if (this.props.devToolOpen !== prevProps.devToolOpen) {
            if (!this._webview) return;
            if (this.props.devToolOpen) {
                this._webview.openDevTools();
            }
            else {
                this._webview.closeDevTools();
            }
        }
    }
    componentWillUnmount() {
        console.log('bookie webview UnMount');
        this._koBrowser = undefined;
        this._webview = undefined;
        this._webContentId = undefined;
        ipcRenderer.removeListener('webcontent-ipc', this.onWebContentMessageFromMainProcess);
        this.props.willUnmount && this.props.willUnmount(this.props.context);
    }
    componentDidMount() {
        console.log('bookie webview Mount');
        const { context } = this.props;
        if (!this._webview) {
            throw new Error('can not load the webview');
        }

        ipcRenderer.on('webcontent-ipc', this.onWebContentMessageFromMainProcess);

        this._webview.addEventListener('ipc-message', ({ channel, args }) => {
            console.debug({ channel, args });
            const msg: WebviewIPCMsg = { data: args.pop(), context: context };

            if (channel !== 'message') {
                console.error('invalid ipc channel', channel);
                return;
            }

            if (!msg.data || !msg.data.msg_type) {
                console.error('invalid ipc message', msg);
                return;
            }

            const sender = this;
            this.props.onIpcMsg && this.props.onIpcMsg(sender, msg);
        });

        this._webview.addEventListener('did-navigate', ({ url }) => {
            console.debug('did-navigate', url);
            this.props.onURLChanged && this.props.onURLChanged(url, false);
        });
        this._webview.addEventListener('did-navigate-in-page', ({ url }) => {
            console.debug('did-navigate-in-page', url);
            this.props.onURLChanged && this.props.onURLChanged(url, true);
        });

        this._webview.addEventListener('did-finish-load', (event) => {
            this.props.onFinishedLoaded && this.props.onFinishedLoaded(this._webview!.getURL());
        });
        this._webview.addEventListener('dom-ready', () => {
            this.props.onDomReady && this.props.onDomReady();
        });
        //this event is undocumented
        //https://github.com/electron/electron/issues/10042
        this._webview.addEventListener('did-attach', (...res) => {
            if (this._webview) {
                this._webContentId = this._webview.getWebContents().id;
            }
            this.turnOnProxyIfNeed();
        });
        this.props.didMount && this.props.didMount(this.props.context);
    }
    onWebContentMessageFromMainProcess = (event: Electron.Event, data: { webContentId: number, msg: string }) => {

        if (data.webContentId !== this._webContentId) {
            return;
        }
        if (data.msg === 'ProxyLoginTooMuchAttempts') {
            this.props.onError && this.props.onError(this.props.context, data.msg);
        }
    }

    private turnOnProxyIfNeed() {
        if (!this._webview) return;
        const { proxyCountry } = this.props;
        const { "common.proxy": proxyAccount } = Settings.getAppSettings();


        //if we get the webview web content after componentDidMount immediately, it will cause webview ui not update. 
        //so it's better to to call "turnOnOrOffProxy" method at 'did-attach' event or  settimeout until webview loaded
        //https://github.com/electron/electron/issues/18462
        const webContent = this._webview.getWebContents();
        if (!proxyAccount || !proxyCountry) {
            webContent.session.setProxy({ proxyRules: '', proxyBypassRules: '', pacScript: '' }, () => {
                console.log('remove proxy succsss');
            });
            return;
        }

        webContent.session.clearAuthCache({ type: 'password' }, () => {
            const { host, port } = proxyAccount;
            persistent.setProxy(webContent.id, { country: proxyCountry, sessionId: '' + ((1000000 * Math.random()) | 0) });

            webContent.session.setProxy(
                { proxyRules: `${host}:${port}` } as any,
                () => console.log("setup proxy done", webContent.id)
            );
        });
    }

    send(data: IOMessage) {
        console.debug('send', data);
        this._webview && this._webview.send('message', data);
    }
    getURL() {
        return this._webview && this._webview.getURL();
    }

    getBrowser() {
        return this._koBrowser!;
    }
    getContext() {
        const { context } = this.props;
        return context;
    }
    render() {

        const { src, script, context, hidden, session } = this.props;
        const { bookmaker, usage } = context;

        //assign the random ua to class field but not bind  getRandomUA to webview "useragent" props
        //to avoid page reload again and again
        if (!this.ua) {
            this.ua = getRandomUA(bookmaker);
        }

        const scriptFolder = electionRemote.injectScriptFolder;
        const scriptPath = electionRemote.path.join(`${scriptFolder}/${usage}/${bookmaker}`, `${script}`);

        return (
            <div style={{
                backgroundColor: '#fff',
                width: '100%',
                height: '100%',
                flex: 1
            }}>
                <webview ref={(c: WebviewTag) => {
                    this._webview = c;
                    this._koBrowser = new KOBrowser(c);
                }
                }
                    useragent={this.ua}
                    style={{ height: '100%', width: '100%', visibility: 'visible' }}
                    className={hidden ? css(styles.hideWebView) : undefined}
                    partition={session} src={src}
                    {...(script ? { preload: 'file://' + scriptPath } : undefined)} />
            </div >
        );
    }
}
const styles = StyleSheet.create({
    hideWebView:
    {
        flex: '0 1',
        width: '0px',
        height: '0px'
    }
}); 