import { Nullable, FixedIntervalTimer } from "../models";

export function generateUUID() {
    let d = new Date().getTime();

    if (window.performance && typeof window.performance.now === "function") {
        d += performance.now();
    }

    let key = 'xxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        let r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : ((r & 0x3) | 0x8)).toString(16);
    });

    return key;
}
export function download(filename: string, text: string, mimeType: string) {
    var pom = document.createElement('a');
    pom.setAttribute('href', `data:${mimeType};charset=utf-8,` + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
}
export function isPromise(object: any) {
    if (Promise && Promise.resolve) {
        return Promise.resolve(object) === object;
    }
    return false;
}
export function toNumber(x: string) {
    const n = (x || '').trim().replace(/[^0-9.]+/g, '');
    return +n;
}
export function financial(x: string | number) {
    return +Number.parseFloat('' + x).toFixed(2);
}
export function toDecimalOdds(odds: string | number) {
    if (('' + odds).indexOf('/') >= 0) {
        const part = ('' + odds).split('/');
        const first = +part[0];
        const second = +part[1];
        return (financial((first / second) + 1));
    }
    else return financial(odds);
}
export function toPrintableNumber(num: number) {
    if (num >= 0) return '+' + num;
    return '' + num;
}
export function getJValue(jData: { [key: string]: any }, path: string): any {
    const pathSegments = path.split('->');
    let cur = jData;
    for (const segment of pathSegments) {
        if (cur[segment] === undefined) return null;
        cur = cur[segment];
    }
    return cur;
}
/**
 * only for json object, not for array
 * @param jData 
 * @param path 
 * @param val 
 */
export function setJValue(jData: { [key: string]: any }, path: string, val: any) {
    const pathSegments = path.split('->');
    let cur = jData;
    for (const segment of pathSegments) {

        if (!cur[segment]) {
            cur[segment] = {};
        }

        if (pathSegments.indexOf(segment) === pathSegments.length - 1) {
            cur[segment] = val;
        }
        else {
            cur = cur[segment];
        }
    }
    return true;
}

/**
 * timeout will resolve undefined,
 * return falsy value (except number 0) will go to next step checking
 * @param process 
 * @param timeout 
 */
export async function waitFor<T>(process: (...args: any[]) => T | Promise<T>, timeout: number) {

    return new Promise<T>((resolve, reject) => {
        let startTime = Date.now();
        let stepTick: Nullable<number> = undefined;
        const _resolve = resolve;

        const nextStep = () => {
            if ((Date.now() - startTime) > timeout) {
                _resolve(undefined);
                window.clearTimeout(stepTick);
                return;
            }
            stepTick = window.setTimeout(doStep, 100);
        }

        const doStep = () => {

            const pp = Promise.resolve(process());
            pp.then(data2 => {
                if (data2 || typeof data2 === 'number') {
                    window.clearTimeout(stepTick);
                    _resolve(data2);
                }
                else {
                    nextStep();
                }
            });
        };
        //always transform result into promise as we don't know process if async or not
        const p = Promise.resolve(process());

        p.then((data) => {
            if (data || typeof data === 'number') {
                resolve(data);
            } else {
                doStep();
            }
        });

    });
}
export function wait(timeout: number) {
    return new Promise(resolve => {
        window.setTimeout(resolve, timeout);
    });
}

export function roundDownStakeAmount(amount: number, roundDigit: number) {
    let roundDownAmount = Math.floor(amount);
    if (amount < roundDigit) return roundDownAmount;
    roundDownAmount = Math.floor(roundDownAmount / roundDigit) * roundDigit;
    return roundDownAmount;
}

export function isSamePathNameAndQuery(url1: string, url2: string) {
    const u1 = new URL(url1);
    const u2 = new URL(url2);
    let p1 = u1.pathname.toLowerCase().trim();
    let p2 = u2.pathname.toLowerCase().trim();
    for (const word of ['/', 'default.aspx', 'index.html', 'index.htm', 'default.asp', 'default.php']) {
        p1 = trimWordRight(p1, word);
        p2 = trimWordRight(p2, word);
    }
    const same = p1 === p2;
    if (!same) return false;

    const q1 = u1.search.toLowerCase().trim();
    const q2 = u2.search.toLowerCase().trim();
    return q1 === q2;

}
export function groupBy(arr: any, property: string) {
    return arr.reduce(function (memo: any, x: any) {
        if (!memo[x[property]]) { memo[x[property]] = []; }
        memo[x[property]].push(x);
        return memo;
    }, {});
}
export function trimWord(text: string, word: string) {

    let s = trimWordLeft(text, word);
    s = trimWordRight(s, word);
    return s;
}
export function trimWordRight(text: string, word: string) {
    let s = text;
    if (text.endsWith(word)) {
        s = text.substr(0, text.lastIndexOf(word));
    }
    return s;
}
export function trimWordLeft(text: string, word: string) {
    let s = text;
    if (text.startsWith(word)) {
        s = text.substr(word.length);
    }
    return s;
}

export const setFixedInterval = (cb: (...args: any[]) => void, timeout: number) => {

    const tickRef: FixedIntervalTimer = { tick: undefined, cancelled: false };

    tickRef.tick = window.setTimeout(async function task() {
        await Promise.resolve(cb());
        if (!tickRef.cancelled) {
            tickRef.tick = window.setTimeout(task, timeout);
        }
    }, timeout);
    return tickRef;
}
export const clearFixedInterval = (timerId: FixedIntervalTimer) => {
    if (!timerId) return;
    window.clearTimeout(timerId.tick!);
    timerId.cancelled = true;
}
export function changeDomainExtension(url: string, newExt: string) {
    try {
        const uri = new URL(url);
        const hostName = uri.hostname;
        const regex = /(.*?)((?:\.co)?.[a-z]{2,4})$/i;
        const matches = hostName.match(regex);
        if (!matches) return url;

        const domainWithExt = matches[1];
        const newHostName = domainWithExt + newExt;
        uri.hostname = newHostName;
        return uri.href;

    } catch (error) {
        console.error(error);
        return url;
    }
}

export const saveAs = (data: string, type: string, fileName: string) => {

    const click = (node: HTMLElement) => {
        try {
            node.dispatchEvent(new MouseEvent('click'))
        } catch (e) {
            const evt = document.createEvent('MouseEvents')
            evt.initMouseEvent('click', true, true, window, 0, 0, 0, 80,
                20, false, false, false, false, 0, null);
            node.dispatchEvent(evt);
        }
    }
    const a = window.document.createElement("a");
    a.target = "_blank";

    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    setTimeout(() => { URL.revokeObjectURL(a.href) }, 4E4);
    setTimeout(() => { click(a) }, 0);
}

export const saveAsCsv = (jArray: any[], fileName: string) => {
    const EOL = '\r\n';
    if (!jArray || jArray.length === 0) return null;
    let csvContent = '';
    for (const key of Object.keys(jArray[0])) {
        csvContent += `"${key}",`;
    }
    csvContent += EOL;

    for (const item of jArray) {
        for (const key in item) {
            csvContent += `"${item[key]}",`;
        }
        csvContent += EOL;
    }
    saveAs(csvContent, 'text/csv', fileName);

}

export const mergeObject = <T extends { [key: string]: any }>(defaultObj: T, obj: Partial<T>) => {
    if (!obj) return { ...defaultObj };
    const cloneObj = { ...obj };
    for (const key of Object.keys(cloneObj)) {
        if (cloneObj[key] === undefined) delete cloneObj[key];
    }
    return { ...defaultObj, ...cloneObj };
}
//to simulate code slow execution
export const fibo = (n: number): number => {
    if (n < 2) return 1;
    return fibo(n - 2) + fibo(n - 1);
}

export const randomStr = (len: number) => {
    if (len > 12) throw new Error('max length is 12');
    return Math.random().toString(36).slice(-len);
}
export const strInsertAt = (originStr: string, insertStr: string, idx: number) => {
    return originStr.slice(0, idx) + insertStr + originStr.slice(idx);
};
export const strReplaceAt = (originStr: string, replaceStr: string, idx: number) => {
    return originStr.substr(0, idx) + replaceStr + originStr.substr(idx + replaceStr.length)
};
export const findKeyByValue = (obj: { [key: string]: any }, value: any) => {
    return Object.keys(obj).find(i => obj[i] === value);
}