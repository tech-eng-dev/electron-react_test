
import { EventEmitter } from 'events';
import iosocket from './iosocket';
import { IOStatus, KOEventForGrab, KOGrabSweet, } from '../models';
import { util } from '.';
import Settings from './Settings';

export const MsgTypes = {
    //get from server
    ServerGrabEventInvalid: 'server-grab-event-invalid',
    ServerGrabEvent: 'server-grab-event',


    //send to server
    UserJoin: 'user-join',
    UserLeave: 'user-leave',
    PlayerGrabData: 'pgd',

    //local
    JoinSuccess: 'join-success',
    JoinFailure: 'join-failue',

    NextGrabEvent: 'next-grab-event',
    GrabEventInvalid: 'grab-event-invalid',
};

export default class BetPlayer extends EventEmitter {

    grabEvents: KOEventForGrab[] = [];

constructor() {
        super();
        this.grabEvents = [];

    }

    start = async () => {
        iosocket.on('io-status-change', this.tryJoin);
        iosocket.on(MsgTypes.ServerGrabEventInvalid, this.onServerGrabEventInvalid);
        iosocket.on(MsgTypes.ServerGrabEvent, this.onServerGrabEvent);
        try {
            await iosocket.open();
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }


    tryJoin = async (status: IOStatus, reason: string) => {
        try {
            if (status !== 'connected') {
                return;
            }
            //todo: clear all the grabbings (reconnect case)
            for (const event of this.grabEvents) {
                this.emit(MsgTypes.GrabEventInvalid, event);
            }
            this.grabEvents = [];

            const userSettings = Settings.getUserSettings();
            const bookmakerCredentials = userSettings['user.betplayer.credentials'];
            const bookmakers: string[] = [];
            for (const bm in bookmakerCredentials) {
                if (bookmakerCredentials[bm].active) {
                    bookmakers.push(bm);
                }
            }
            const res = await iosocket.sendMessageWaitAck({
                msg_type: MsgTypes.UserJoin,
                context: {
                    modes: userSettings["user.betplayer.modes"] || [],
                    sports: userSettings['user.betplayer.sports'] || [],
                    bookmakers: bookmakers
                }
            });
            const { error } = res;

            if (!error) {
                this.emit(MsgTypes.JoinSuccess);
            }
            else {
                this.emit(MsgTypes.JoinFailure, error);
            }
        } catch (error) {
            console.error({ error });
            this.emit(MsgTypes.JoinFailure, error.message);
        }
    }


    onServerGrabEventInvalid = ({ euuid }: { euuid: string }) => {

        const invalidEvent = this.grabEvents.find(i => i.uuid === euuid);
        if (invalidEvent) {
            this.grabEvents.splice(this.grabEvents.indexOf(invalidEvent), 1);
            this.emit(MsgTypes.GrabEventInvalid, invalidEvent);
        }
    }

    onServerGrabEvent = ({ event, cb }: { event: KOEventForGrab, cb: Function }) => {
        console.log('onServerGrabEvent', event)
        const exist = this.grabEvents.some((i) => i.uuid === event.uuid);;
        if (exist) return;

        const { 'user.site.extensions': siteExtensions } = Settings.getUserSettings();
        if (siteExtensions[event.bookmaker]) {
            event.url = util.changeDomainExtension(event.url, siteExtensions[event.bookmaker]);
        }

        this.grabEvents.push(event);
        this.emit(MsgTypes.NextGrabEvent, event);

    }

    sendGrabData(data: { grab: KOGrabSweet, error?: string }) {
        try {
            
        iosocket.sendMessage({ ...data, msg_type: MsgTypes.PlayerGrabData });
        } catch (error) {
            console.error(error);
        }
    }

    async stop() {
        try {
            try {
                iosocket.sendMessage({ msg_type: MsgTypes.UserLeave });
            } catch (error) {
                console.warn(error);
            }

            iosocket.removeListener('io-status-change', this.tryJoin);
            iosocket.removeListener(MsgTypes.ServerGrabEvent, this.onServerGrabEvent);
            iosocket.removeListener(MsgTypes.ServerGrabEventInvalid, this.onServerGrabEventInvalid);
            iosocket.close();
            this.grabEvents = [];
        } catch (error) {
            console.error(error);
        }


    }


}
