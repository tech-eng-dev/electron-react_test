import { Remote } from 'electron';

declare const window: any;

const remote: Remote = window.require('electron').remote;

const context = remote.require('./context');

export const focusOnWin = () => {
    const browserWin = remote.getCurrentWindow();
    browserWin.focus();

}

export const path = (window as any).require('path');

export const injectScriptFolder: string = context.getInjectScriptFolderPath();
export const electronScriptFolderPath: string = context.getElectronScriptFolderPath();

export const log = (app: string, jMsg: any, level?: string) => context.log(app, jMsg, level);
export const writeJson = (fname: string, data: any, mode?: string) => context.writeJson(fname, data, mode);
export const readJson = (fname: string): any[] => context.readJson(fname);
export const getAppVersion = (): string => context.getAppVersion();
export const exportJsonToCsV = (items: any[], iname: string) => context.exportJsonToCsv(items, iname);
export const getSession = (partition: string) => remote.session.fromPartition(partition);
export const getProcessId = ():number => context.getProcessId();
