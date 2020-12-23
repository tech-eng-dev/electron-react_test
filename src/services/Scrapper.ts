import { EventEmitter } from 'events';
import Settings from './Settings';
import iosocket from './iosocket';
import { IOStatus, ScrapperBookmaker, KOScrapEvent, FixedIntervalTimer } from '../models';
import { util } from '.';
const MsgTypes = {
    UserJoin: 'user-join',
    UserLeave: 'user-leave',

    //local
    JoinSuccess: 'join-success',
    JoinFailure: 'join-failue'

};

type ScrapperQueue = { wait: ScrapperBookmaker[], work: ScrapperBookmaker[], interval: number };
export default class Scrapper extends EventEmitter {
    private bookmakers: ScrapperBookmaker[] = [];

    private readonly queues: { live: ScrapperQueue, prematch: ScrapperQueue } = {
        live: { wait: [], work: [], interval: 5 * 60, },
        prematch: { wait: [], work: [], interval: 60 * 30, }
    }
    private capacity = 3;
    private scrapTimerIds: FixedIntervalTimer[] = [];
 
    async start() {

        try {
            iosocket.on('io-status-change', this.tryJoin);

            await iosocket.open();
            const { 'scrapper.bookmakers': bookmakers,
                'scrapper.capacity': capacity,
                'scrapper.live.interval': liveInterval,
                'scrapper.prematch.interval': prematchInterval } = Settings.getAppSettings();

            const { "user.site.extensions": userSiteExtensions } = Settings.getUserSettings();


            this.bookmakers = bookmakers.filter(i => i.active).map(i => {
                let url = i.url;
                let ext = userSiteExtensions[i.name];

                if (ext) {
                    url = util.changeDomainExtension(i.url, ext);
                }

                return { ...i, url: url };
            });
            this.capacity = capacity;

            this.queues.prematch.wait = this.bookmakers.filter(i => !i.isLive);
            this.queues.live.wait = this.bookmakers.filter(i => i.isLive);
            this.queues.prematch.interval = prematchInterval;
            this.queues.live.interval = liveInterval;
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
                this.startScrapJobs();
            }
            else{
                this.emit(MsgTypes.JoinFailure, error);

            }
   
        } catch (error) {
            console.error({ error });
            this.emit(MsgTypes.JoinFailure, error.message);
        }
    }

    startScrapJobs() {
        console.log('start scrapper job');
        this.scrapTimerIds.forEach(i => util.clearFixedInterval(i));
        this.scrapTimerIds = [];

        const job = async (mode: 'live' | 'prematch') => {
            this.queues[mode].wait = [...this.bookmakers.filter(i => mode === 'prematch' ? !i.isLive : i.isLive)];
            this.queues[mode].work = [];
            await this.next(mode);
        }
        (['prematch', 'live'] as ('live' | 'prematch')[]).forEach((mode) => {
            job(mode);

            const timeId = util.setFixedInterval(async () => {
                console.log('startScrapLoopThread');
                await job(mode);
            }, this.queues[mode].interval * 1000);

            this.scrapTimerIds.push(timeId);
        });
    }
    async next(mode: 'prematch' | 'live', finishedBookmaker?: ScrapperBookmaker) {

        const modeQueues = this.queues[mode];
        if (finishedBookmaker) {
            const fuuid = finishedBookmaker.name + '-' + finishedBookmaker.sport + '-' + (finishedBookmaker.isLive ? 'live' : 'prematch');
            const index = modeQueues.work.findIndex(i => (i.name + '-' + i.sport + '-' + (i.isLive ? 'live' : 'prematch')) === fuuid);
            if (index >= 0)
                modeQueues.work.splice(index, 1);
        }

        while (modeQueues.work.length < this.capacity
            && modeQueues.wait.length > 0) {
            const next = modeQueues.wait.shift()!;
            modeQueues.work.push(next);
            this.emit('next', next);

            await util.wait(5000);
        }
        if (modeQueues.wait.length === 0) {
            this.emit('finished');
        }
    }
    async sendDataToServer(data: { events: KOScrapEvent[] }) {
        console.log({ data });
        const ackData = await iosocket.sendMessageWaitAck({ msg_type: 'event-extraction', ...data }, 1000 * 60 * 2);
        console.log({ ackData });
        return ackData;
    }
    stop() {
        try {
            this.scrapTimerIds.forEach(i => util.clearFixedInterval(i));
            this.scrapTimerIds = [];
            try {
                iosocket.sendMessage({ msg_type: MsgTypes.UserLeave });
            } catch (error) {
                console.error(error);
            }
            iosocket.removeListener('io-status-change', this.tryJoin);
            iosocket.close();
            this.bookmakers = [];
        } catch (error) {
            console.error(error);
        }

    }
}
