import { WebviewTag } from "electron";
import { util } from ".";
import { Nullable } from "../models";

/**
 * these script will be run at webview context
 *  */
const DEFAULT_TIMEOUT: number = 2500;
export default class KOBrowser {
    public get webContents() { return this.wv.getWebContents() }
    constructor(private wv: WebviewTag) {
    }


    /**
     * don't return dom node as it will hang the ipc 
     */
    executeJs<T>(script: string) {


        const wrapScript = ` (() => { try { return (${script}) } catch (error) { return Promise.reject(error.message); } })();`;
        return new Promise<T>((resolve, reject) => {

            let timeoutTick: Nullable<number> = undefined;
            timeoutTick = window.setTimeout(() => {
                reject('TIMEOUT ' + script);
            }, 5000);

            console.debug('executeJs', wrapScript);

            this.webContents.executeJavaScript(wrapScript, false).then(val => {
                window.clearTimeout(timeoutTick);
                console.debug('executeJavaScript result', val);
                resolve(val);
            }).catch(err => {
                console.debug('executeJavaScript result error', err);
                window.clearTimeout(timeoutTick);
                reject((err.message || err) + script)
            });
        });
    }
    waitReady() {
        return new Promise<Boolean>((resolve, reject) => {
            let st = Date.now();
            let tick = window.setInterval(() => {
                try {
                    const wc = this.wv.getWebContents();
                    const url = wc.getURL();
                    if (wc && url) {
                        console.warn({ url });
                        resolve(true);
                        clearInterval(tick);
                    }
                } catch (error) {

                }
                if (Date.now() - st > 5000) {
                    clearInterval(tick);
                    resolve(false);
                }

            }, 100);
        });
    }
    url() {
        try {
            return new URL(this.wv.getURL());
        } catch (error) {
            return null;
        }

    }

    goto(url: string, timeout: number = 30000) {
        return new Promise((resolve, reject) => {
            const tick = window.setTimeout(() => {
                reject('TIMEOUT ON LOAD URL ' + url);
            }, timeout);

            this.wv.loadURL(url);
            console.warn('go to url', url);
            this.wv.getWebContents().once('did-finish-load', () => {
                console.warn('did-finish-loaded', url);
                window.clearTimeout(tick);
                resolve(url);
            });

        });
    }

    /**
     * run script at iframe on the page inside webview
     * @param frameSelector 
     * @param script the script whould be inline string without line break (otherwsie error occur at the ipc render (invalid token))
     */
    runScriptAtFrame<T>(frameSelector: string, script: string, timeout?: number) {
        return this.webContents.executeJavaScript(`window.__kingpin.runScriptAtFrame('${frameSelector}','${script}',${timeout || 1})`);
    }

    wait(timeout: number) {
        return util.wait(timeout);
    }
    /**
     * 
 * timeout will resolve undefined,
 * return falsy value (except number 0) will go to next step checking
     */
    waitFor<T>(runner: (...args: any[]) => T | Promise<T>, timeout: number = DEFAULT_TIMEOUT) {
        return util.waitFor<T>(runner, timeout);
    }

    async isEleExist(selector: string, frameName?: string) {
        const script = !frameName ? `!!document.querySelector('${selector}')` : `(()=>{
            const frameDoc= (document.querySelector("iframe[name=${frameName}]")||{contentDocument:null}).contentDocument;
            if(!frameDoc) return false;
            return !!frameDoc.querySelector('${selector}')
           })()` ;
        return await this.executeJs<Boolean>(script);
    }
    /**
 * 
* timeout will resolve undefined,
* return falsy value (except number 0) will go to next step checking
 */
    async waitForEle(selector: string, timeout: number = DEFAULT_TIMEOUT, frameName?: string) {
        const exist = await this.waitFor<Boolean>(async () => {
            try {
                const script = !frameName ? `!!document.querySelector('${selector}')` : `(()=>{
                 const frameDoc= (document.querySelector("iframe[name=${frameName}]")||{contentDocument:null}).contentDocument;
                 if(!frameDoc) return false;
                 return !!frameDoc.querySelector('${selector}')
                })()` ;
                const result = await this.executeJs<Boolean>(script);
                return result;
            } catch (error) {
                return false;
            }

        }, timeout);
        return exist;
    }
    /**
 * 
* timeout will resolve undefined,
* return falsy value (except number 0) will go to next step checking
 */
    async waitForJs<T>(script: string, timeout: number = DEFAULT_TIMEOUT) {
        const result = await this.waitFor<Nullable<T>>(async () => {
            try {
                const result = await this.executeJs<T>(script);
                return result;
            } catch (error) {
                console.error(error);
                return undefined;
            }
        }, timeout);
        return result;
    }

    async  waitForEleCount(selector: string, timeout: number = DEFAULT_TIMEOUT, frameName?: string) {
        try {
            const exist = await this.waitForEle(selector, timeout, frameName);
            if (!exist) return 0;

            const script = !frameName ? `document.querySelectorAll('${selector}').length` : `(()=>{
                const frameDoc= (document.querySelector("iframe[name=${frameName}]")||{contentDocument:null}).contentDocument;
                if(!frameDoc) return 0;
                return frameDoc.querySelectorAll('${selector}').length;
               })()` ;

            const len = await this.executeJs<number>(script);
            return len;
        } catch (error) {
            //timeout
            return 0;
        }

    }
    async  getEleCount(selector: string, timeout: number = DEFAULT_TIMEOUT, frameName?: string) {
        try {

            const script = !frameName ? `document.querySelectorAll('${selector}').length` : `(()=>{
                const frameDoc= (document.querySelector("iframe[name=${frameName}]")||{contentDocument:null}).contentDocument;
                if(!frameDoc) return 0;
                return frameDoc.querySelectorAll('${selector}').length;
               })()` ;

            const len = await this.executeJs<number>(script);
            return len;
        } catch (error) {
            //timeout or ele not exist
            return 0;
        }

    }

    async getEleValue(selector: string, frameName?: string) {
        const script = !frameName ? `(()=>{
            const node=document.querySelector('${selector}');
            if(node) return node.value;
            else return undefined;
        })()`: `(()=>{
            const frameDoc= (document.querySelector("iframe[name=${frameName}]")||{contentDocument:null}).contentDocument;
            if(!frameDoc) return undefined;
            const node=frameDoc.querySelector('${selector}');
            if(node) return node.value;
            else return undefined;
        })()`;
        return await this.executeJs<Nullable<string>>(script);
    }
    async waitForEleValue(selector: string, timeout: number = DEFAULT_TIMEOUT, frameName?: string) {
        const exist = await this.waitForEle(selector, timeout, frameName);
        if (!exist) return undefined;

        return this.getEleValue(selector, frameName);
    }


    async getEleText(selector: string, frameName?: string) {

        const script = !frameName ? `(()=>{
            const node=document.querySelector('${selector}');
            if(node) return node.textContent.trim();
            else return '';})()`: `
            (()=>{
                const frameDoc= (document.querySelector("iframe[name=${frameName}]")||{contentDocument:null}).contentDocument;
                if(!frameDoc) return '';
                const node=frameDoc.querySelector('${selector}');
                if(node) return node.textContent.trim();
                else return '';})()
            `;
        return await this.executeJs<string>(script);
    }

    async waitForEleText(selector: string, timeout: number = DEFAULT_TIMEOUT, frameName?: string) {
        const exist = await this.waitForEle(selector, timeout, frameName);
        if (!exist) return '';

        return this.getEleText(selector, frameName);
    }
    async getEleInnerHtml(selector: string, timeout: number = DEFAULT_TIMEOUT, frameName?: string) {
        const exist = await this.waitForEle(selector, timeout, frameName);
        if (!exist) return '';

        const script = !frameName ? ` (()=>{ 
            const node=document.querySelector('${selector}');
            if(node) return node.innerHTML.trim();
            else return '';
             })()
            `: ` (()=>{ 
                const frameDoc= (document.querySelector("iframe[name=${frameName}]")||{contentDocument:null}).contentDocument;
                if(!frameDoc) return '';
                if(node) return node.innerHTML.trim();
                else return '';
                 })()
                `;
        return await this.executeJs<string>(script);
    }

    async getEleAttribute(selector: string, attributeName: string, timeout: number = DEFAULT_TIMEOUT, frameName?: string) {
        const exist = await this.waitForEle(selector, timeout, frameName);
        if (!exist) return undefined;

        const script = !frameName ? `(()=>{
             const node=document.querySelector('${selector}');
            if(node) return node.getAttribute('${attributeName}');
            else return undefined;})()
            `: `(()=>{
                const frameDoc= (document.querySelector("iframe[name=${frameName}]")||{contentDocument:null}).contentDocument;
                if(!frameDoc) return undefined;
                const node=frameDoc.querySelector('${selector}');
               if(node) return node.getAttribute('${attributeName}');
               else return undefined;})()
               `;
        return await this.executeJs<string>(script);
    }

    async simulateClick(selector: string, clickType: string = 'click', frameName?: string) {

        const script = !frameName ? `(()=>{
            const $node=document.querySelector('${selector}');
        $node.dispatchEvent(new MouseEvent('${clickType || 'click'}', {
            'bubbles': true,
            'cancelable': true
          }));
           return true;
        })()
          `: `(()=>{
            const frameDoc= (document.querySelector("iframe[name=${frameName}]")||{contentDocument:null}).contentDocument;
            if(!frameDoc) return false;
            const $node=frameDoc.querySelector('${selector}');
         $node.dispatchEvent(new MouseEvent('${clickType || 'click'}', {
            'bubbles': true,
            'cancelable': true
          }));
           return true;
        })()`;

        return this.executeJs<boolean>(script);

    }
    async simulateEvalClick(selector: string, frameName?: string) {

        const script = !frameName ? `    
            setTimeout(function(){
                    eval(document.querySelector('${selector}').href)

            }, 200)
          `: `   
          setTimeout(function(){
            const frameDoc= (document.querySelector("iframe[name=${frameName}]")||{contentDocument:null}).contentDocument;
            if(!frameDoc) return false;
                eval(frameDoc.querySelector('${selector}').href)

          }, 200)`
            ;

        return this.executeJs<boolean>(script);

    }
    async simulateInput(selector: string, value: string, frameName?: string) {

        const script = !frameName ? `(()=>{
            const $node=document.querySelector('${selector}');
            $node.value='${value}';
            $node.dispatchEvent(new Event('input', {
                'bubbles': true,
                'cancelable': true
            })); return true;
        })()
          `: `(()=>{
            const frameDoc= (document.querySelector("iframe[name=${frameName}]")||{contentDocument:null}).contentDocument;
            if(!frameDoc) return false;
            const $node=frameDoc.querySelector('${selector}');
            $node.value='${value}';
            $node.dispatchEvent(new Event('input', {
                'bubbles': true,
                'cancelable': true
            })); return true;
        })()`;

        return this.executeJs<boolean>(script);

    }

    sessionValue(key: string, value?: string) {
        if (value === undefined) {
            value = 'undefined';
        }
        const script = `(()=>{
            if ('${value}' === 'undefined') {
          if (Object.keys(sessionStorage).indexOf('${key}') === -1) {
            return undefined;
          }
          const val = JSON.parse(sessionStorage.getItem('${key}'));
          return val;
        }
        sessionStorage.setItem('${key}', '${value}');
        return true;
        })()
        `;
        return this.executeJs(script);
    }
    removeSession(key: string) {

        const script = `(()=>{
        sessionStorage.removeItem('${key}');
        return true;
        })()
        `;
        return this.executeJs(script);
    }

    cookieValue(name: string, value?: string) {
        if (value === undefined) {
            value = 'undefined';
        }
        const script = `(()=>{
            if ('${value}' === 'undefined') {
                const cookieData = "; " + document.cookie;
                const parts = cookieData.split("; " + '${name}' + "=");
                if (parts.length === 2) {
                    const val = parts.pop().split(";").shift();
                    return val;
                }
                return undefined;
            }
            else {
                document.cookie = '${name}=${value}';
                return true;
            }
         })() `;

        return this.executeJs<string>(script);


    }

}