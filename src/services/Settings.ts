
import { AppSettings, UserSettings, Nullable } from '../models';
import { util } from '.';
const electronRemote: Electron.Remote = (window as any).require("electron").remote;
const context = electronRemote.require('./context');

class Settings {
    private appSettings: Nullable<AppSettings> = undefined;
    private userSettings: Nullable<UserSettings> = undefined;

    getAppSettings(): AppSettings {

        if (this.appSettings === undefined)
            this.appSettings = context.getAppSettings();

        return this.appSettings as AppSettings;

    }
    getUserSettings(): UserSettings {
        if (this.userSettings == null) {
            const us = context.getUserSettings();

            const usWithDefault = util.mergeObject<UserSettings>(
                {
                    "user.betplayer.credentials": {},
                    "user.site.extensions": {},
                    "user.betplayer.fixedReturns": 2,
                    "user.betplayer.roundDownDigit": 1,
                    "user.betplayer.modes": ['live'],
                    "user.betplayer.sports": ['tennis', 'football'],
                    "user.betplayer.betOddsRange": [1, 80],
                    "user.betplayer.rebetOddsFluctuation": undefined,
                    "user.proxies.countries": {},
                    "user.proxies.turnOn": false,
                    "user.proxies.account": undefined
                }, us);

            const { "site.extensions": appSiteExtensions } = this.getAppSettings();
            Object.keys(appSiteExtensions).forEach(maker => {
                if (!usWithDefault["user.site.extensions"][maker]) {
                    usWithDefault["user.site.extensions"][maker] = appSiteExtensions[maker][0];
                }
            });
            this.userSettings = usWithDefault;
        }

        return this.userSettings;

    }
    saveUserSettings(settings: UserSettings) {
        context.saveUserSettings(JSON.stringify(settings));
        this.userSettings = undefined;
    }
    
    getProxyCountry(bookmaker: string) {
        const userSettings = this.getUserSettings();
        const proxyOn = userSettings['user.proxies.turnOn'];
        if (!proxyOn) return undefined;

        const proxyAccount = userSettings['user.proxies.account'];
        if (!proxyAccount || !proxyAccount.username || !proxyAccount.password) return undefined;

        return (userSettings['user.proxies.countries'] || {})[bookmaker];
    }
}

export default new Settings();
