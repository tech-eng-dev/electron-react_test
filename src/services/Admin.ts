import { EventEmitter } from 'events';
import iosocket from './iosocket';
import {
    IOStatus, KOServerSettings,
    KOUser,
    Nullable,
    KOOddsSweet,
    BetProfitCriteria,
    BetProfitSearchResult,
} from '../models';
import * as iohttp from './iohttp';
import { Common } from '.';
import { wxy } from './abc';

export const MsgTypes = {


    //send to server
    UserJoin: 'user-join',
    UserLeave: 'user-leave',

    //local
    JoinSuccess: 'join-success',
    JoinFailure: 'join-failue',
    LocalSettingUpdate: 'setting-update',
    LocalClientUpdate: 'client-update',
    LocalOpenEventUpdate: 'open-event-update',
    LocalValueOdds: 'local-value-odds',
    LocalValueOddsForDisplay: 'local-value-odds-for-display',

    UserList: 'users-update'

};

export default class Admin extends EventEmitter {


    private clientListTimerId: Nullable<number> = undefined;
    private openEventListTimerId: Nullable<number> = undefined;

    async start() {

        iosocket.on('vo', this.onServerValueOdds);
        iosocket.on('vod', this.onServerValueOddsForDisplay);
        iosocket.on('io-status-change', this.tryJoin);

        try {
            await iosocket.open();
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    tryJoin = async (status: IOStatus) => {
        try {
            if (status !== 'connected') {
                return;
            }

            const res = await iosocket.sendMessageWaitAck({ msg_type: MsgTypes.UserJoin });
            const { error } = res;

            if (!error) {
                this.emit(MsgTypes.JoinSuccess);
                this.startClientsMonitor();
                this.startOpenEventMonitors();

                this.getUsers();

                const { code, res: settings } = await iohttp.get('/server/settings', true);
                console.log({ res, code });

                if (code === 200) {
                    this.emit(MsgTypes.LocalSettingUpdate, settings);
                }
            }
            else {
                this.emit(MsgTypes.JoinFailure, error);
            }
        } catch (error) {
            console.error({ error });
            this.emit(MsgTypes.JoinFailure, error.message);
        }
    }

    async saveSettings(settings: KOServerSettings) {
        return iohttp.post('/server/settings', true, { settings });
    }

    async saveUser(user: Partial<KOUser>) {
        return await iohttp.post('/user/add', true, { user });
    }
    async updateUser(user: Partial<KOUser>) {
        return await iohttp.post('/user/edit', true, { user });
    }
    async removeUser(uid: number) {
        return await iohttp.post('/user/delete', true, { uid });
    }


    startClientsMonitor() {
        clearInterval(this.clientListTimerId);
        this.clientListTimerId = window.setInterval(async () => {
            try {
                const { code, res: clients } = await iohttp.get('/client/list', true);
                if (code === 200 && clients) {
                    this.emit(MsgTypes.LocalClientUpdate, clients);
                }
            } catch (error) {

            }

        }, 5 * 1000);
    }

    startOpenEventMonitors() {
        clearInterval(this.openEventListTimerId);
        const job = async () => {
            try {
                const { code, res: events } = await iohttp.get('/event/list', true);

                if (code === 200 && events) {
                    this.emit(MsgTypes.LocalOpenEventUpdate, events);
                }
            } catch (error) {
                console.error(error);
            }

        };
        job();
        this.openEventListTimerId = window.setInterval(async () => {
            await job();
        }, 15 * 1000);
    }

    public async getUsers() {

        try {
            const { code, res: users } = await iohttp.get('/user/list', true);
            console.log({ code, users });
            if (code === 200 && users) {
                this.emit(MsgTypes.UserList, users);
            }
        } catch (error) {
            console.error(error);
        }
    }

    public async refreshBets(criteria: BetProfitCriteria) {
        try {
            const { res, code } = await iohttp.get('/bet/profit', true, { ...criteria });

            if (code !== 200) return null;

            return res as BetProfitSearchResult;

        } catch (error) {
            console.error(error);
            return null;
        }
    }

    onServerValueOdds = ({ vos }: { vos: string, cb?: (...args: any) => void }) => {
        if (!vos) return;
        try {
            const vosArray: KOOddsSweet[] = JSON.parse(wxy(vos));

            const valueOdds = vosArray.map(i => Common.SweetOddsToValueOdds(i));

            this.emit(MsgTypes.LocalValueOdds, valueOdds);
        } catch (error) {
            iohttp.post('/log/bet', true, { log: error.message || error });
        }

    }
    onServerValueOddsForDisplay = ({ vos }: { vos: string, cb?: (...args: any) => void }) => {
        if (!vos) return;
        try {
            const vosArray: KOOddsSweet[] = JSON.parse(wxy(vos));
            const valueOdds = vosArray.map(i => Common.SweetOddsToValueOdds(i));
            this.emit(MsgTypes.LocalValueOddsForDisplay, valueOdds);
        } catch (error) {
            iohttp.post('/log/bet', true, { log: error.message || error });
        }

    }

    stop() {
        try {
            clearInterval(this.clientListTimerId);
            clearInterval(this.openEventListTimerId);
            try {
                iosocket.sendMessage({ msg_type: MsgTypes.UserLeave });
            } catch (error) {
                console.error(error);
            }

            iosocket.on('vo', this.onServerValueOdds);
            iosocket.on('vod', this.onServerValueOddsForDisplay);
            iosocket.removeListener('io-status-change', this.tryJoin);
            iosocket.close();

        } catch (error) {
            console.error(error);
        }
    }

}
