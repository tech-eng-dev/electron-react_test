import { AppUser } from "../models";
export declare type ProxyInfo = { country: string, sessionId: string };

let ElectronStore: any = null;
const RemoteStore = () => {
    //deferred call the store so that don't cause window.require is not a function
    if (!ElectronStore) {
        const electronRemote: Electron.Remote = (window as any).require("electron").remote;
        ElectronStore = electronRemote.require('./Store');
    }
    return ElectronStore;
}
export function getUser() {
    const user: AppUser = RemoteStore().get('user');
    if (!user) return null;
    return user;
}
export function setUser(user: AppUser | null) {
    RemoteStore().set('user', user);
}

export function getToken() {
    const user = getUser();
    if (!user) return null;
    const { token } = user;
    return token;
}
export function getProxy(webContentId: number): ProxyInfo {
    const proxyCountries = (RemoteStore().get('proxies') || {});
    return proxyCountries[webContentId] as ProxyInfo;
}
export function setProxy(webContentId: number, proxyInfo: ProxyInfo | undefined) {
    const proxyCountries = (RemoteStore().get('proxies') || {});
    proxyCountries[webContentId] = proxyInfo;
    RemoteStore().set('proxies', { ...proxyCountries });
}
