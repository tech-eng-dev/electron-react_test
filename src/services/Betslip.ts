import { EventEmitter } from 'events';
import moment from 'moment';
import { electionRemote, Settings, util, iohttp, Common } from '.';
import iosocket from './iosocket';
import {
    KOBookmaker, KOOdds, KOBet, BookmakerCredential, KOOddsWithOption
    , KOOddsSweet, PlacedBetSearchCriteria, PlacedBetSearchResult, KOBetWithoutBaseInfo
} from '../models';
import { KOSet } from './Set';
import { wxy } from './abc';

const MAX_BET_POST_ERROR = 4;
export const MsgTypes = {
    //local
    bookmakerUpdate: 'slip-bookmaker-upate',
    TryBet: 'try-bet',
    BetTimeout: 'bet-timeout',
    OddsOnBetUpdated: 'odds-onbet-updated',
    BetPostError: 'bet-post-error',
    valueOddsFromSever: 'value-odds-from-server',
    displayOddsFromServer: 'display-odds-from-server'
};
export default class Betslip extends EventEmitter {
    betPostErrorNos: number = 0;
    bookmakers: KOBookmaker[] = [];

    valueOddsSnapshot: KOSet<KOOdds> = new KOSet(a => a.uuid);
    /**
    * key is bookmaker name
    */
    oddsOnBet: Map<string, KOOddsWithOption> = new Map();

    oddsOnWait: KOSet<KOOdds> = new KOSet(a => a.uuid);

    fixedReturns = 5;
    roundDownDigit = 1;
    rebetOddsFluctuation: number | undefined;
    betOddsRange: [number, number] = [1, 80];

    modes: ('prematch' | 'live')[] = ['prematch'];
    sports: string[] = ['football', 'tennis'];
    oddsPanel = false;

    betPlacedFile: string;
    placedBets: (KOBetWithoutBaseInfo & { error?: string })[] = [];

    betTimeoutThread: number | undefined = undefined;


    constructor() {
        super();
        const startedDate = moment().format('YYYYMMDD');
        this.betPlacedFile = `betHistories/${startedDate}-bet-placed.json`;
    }
    start() {

        const { 'user.betplayer.credentials': credentials,
            'user.betplayer.fixedReturns': fixedReturns,
            "user.betplayer.roundDownDigit": roundDownDigit,
            "user.betplayer.modes": modes,
            "user.betplayer.sports": sports,
            'user.site.extensions': siteExtensions,
            'user.betplayer.betOddsRange': betOddsRange,
            'user.betplayer.rebetOddsFluctuation': rebetOddsFluctuation } = Settings.getUserSettings();

        const { "betplayer.bookmakers": bookmakers, 'betplayer.oddsPanel': oddsPanel } = Settings.getAppSettings();

        this.fixedReturns = +fixedReturns || 2;
        this.roundDownDigit = roundDownDigit || 1;
        this.modes = modes || ['prematch'];
        this.sports = sports || ['tennis', 'football'];
        this.oddsPanel = oddsPanel;
        this.betOddsRange = betOddsRange || [1, 80];
        this.rebetOddsFluctuation = rebetOddsFluctuation;

        const bookmakerCredentials: BookmakerCredential[] = bookmakers.map(maker => {
            if (!credentials) return null;
            if (!credentials[maker.name] || !credentials[maker.name].active) return null;
            const credential = credentials[maker.name];

            const bc: BookmakerCredential = { ...maker, ...credential };
            const ext = siteExtensions[maker.name];
            if (ext) {
                bc.homeUrl = util.changeDomainExtension(bc.homeUrl, ext);
                bc.loginUrl = util.changeDomainExtension(bc.loginUrl, ext);
            }
            return bc;
        }).filter(i => !!i) as BookmakerCredential[];

        this.updateBookmakers(bookmakerCredentials);

        this.placedBets = (electionRemote.readJson(this.betPlacedFile) || []);


        iosocket.on('vo', this.onServerValueOdds);

        if (this.oddsPanel) {
            iosocket.on('vod', this.onServerDisplayValueOdds);
        }

        this.startBetTimoutMonitor();


    }
    startBetTimoutMonitor() {

        clearInterval(this.betTimeoutThread);
        this.betTimeoutThread = window.setInterval(() => {
            for (const [makerName, odds] of this.oddsOnBet) {
                const now = Date.now();
                if (now - odds.betTime > 1000 * 25) {
                    this.emit(MsgTypes.BetTimeout, makerName, odds);
                    this.nextBet(makerName, { ...odds, placedStake: null, placedOdds: null, placedReference: null });
                }
            }
        }, 1000);
    }

    stop() {
        iosocket.removeListener('vo', this.onServerValueOdds);
        if (this.oddsPanel) {
            iosocket.removeListener('vod', this.onServerDisplayValueOdds);
        }

        clearInterval(this.betTimeoutThread);
    }

    updateBookmakers(makers: BookmakerCredential[]) {
        const activeMakers = makers.filter(i => i.active);

        let isUpdated = false;
        for (const maker of activeMakers) {
            const bmName = maker.name;
            if (!this.bookmakers.find(i => i.name === bmName)) {
                this.bookmakers.push({ name: bmName, betable: false, credential: maker });
                isUpdated = true;
            }
        }
        if (isUpdated) {
            this.emit(MsgTypes.bookmakerUpdate, [...this.bookmakers]);
        }
    }

    onServerDisplayValueOdds = ({ vos }: { vos: string }) => {
        try {
            if (this.oddsPanel) {
                const vosArray: KOOddsSweet[] = JSON.parse(wxy(vos));
                const valueOdds = vosArray.map(i => Common.SweetOddsToValueOdds(i));
                this.emit(MsgTypes.displayOddsFromServer, valueOdds);
            }
        } catch (error) {
            iohttp.post('/log/bet', true, { log: error.message || error });
        }


    }
    onServerValueOdds = ({ vos }: { vos: string }) => {
        // console.log('onValueOddsUpdate', valueOdds);
        //if you want to test, you can change the bmValueOdds here
        // (read from mock data and assign it to this variable for testing)

        try {
            const vosArray: KOOddsSweet[] = JSON.parse(wxy(vos));
            const valueOdds = vosArray.map(i => Common.SweetOddsToValueOdds(i));

            if (this.oddsPanel) {
                this.emit(MsgTypes.valueOddsFromSever, valueOdds);
            }
            let bmValueOdds = valueOdds.filter(z => this.bookmakers.findIndex(i => i.name === z.bookmaker) >= 0);

            bmValueOdds = bmValueOdds.filter(i =>
                ((i.isLive && this.modes.includes('live')) || (!i.isLive && this.modes.includes('prematch')))
                && this.sports.includes(i.sport)
                && i.odds >= this.betOddsRange[0] && i.odds <= this.betOddsRange[1]
            );


            const removes = this.valueOddsSnapshot.values().filter(i => bmValueOdds.findIndex(z => z.uuid === i.uuid) === -1);

            const updates: KOOdds[] = bmValueOdds.filter(i =>
                this.valueOddsSnapshot.values().findIndex(z => z.uuid === i.uuid && util.financial(z.odds) !== util.financial(i.odds)) >= 0);

            const adds: KOOdds[] = bmValueOdds.filter(i => !this.valueOddsSnapshot.has(i));


            //update snapshot
            for (const r of removes) {
                this.valueOddsSnapshot.delete(r);
            }

            for (const oddsItem of bmValueOdds) {
                this.valueOddsSnapshot.addOrUpdate(oddsItem);
            }

            //update odds on beting
            for (const [wuuid, odds] of this.oddsOnBet) {
                let changedOdds = updates.find(i => i.uuid === odds.uuid);
                if (changedOdds) {
                    this.emit(MsgTypes.OddsOnBetUpdated, wuuid, { ...odds, ...changedOdds, fixedReturns: this.fixedReturns });
                }
                else {
                    changedOdds = removes.find(i => i.uuid === odds.uuid);
                    //for removed
                    if (changedOdds) {
                        this.emit(MsgTypes.OddsOnBetUpdated, wuuid, null);
                    }
                }
            }

            //add or update updates odds on waiting
            for (const item of [...adds, ...updates]) {

                const betted = this.skipBetOddsIfBettedOrSomeConditions(item);

                const onBet = [...this.oddsOnBet.values()].some(i => i.uuid === item.uuid);

                if (!betted && !onBet) {
                    this.oddsOnWait.addOrUpdate(item);
                }
            }

            for (const item of removes) {
                this.oddsOnWait.delete(item);
            }

            for (const bookmaker of this.bookmakers) {
                if (!bookmaker.betable) continue;

                this.startBookmakerBet(bookmaker);
            }
        } catch (error) {
            iohttp.post('/log/bet', true, { log: error.message || error });
        }
    }

    setBookmakerBetEnable(bmName: string, enable: boolean) {
        const maker = this.bookmakers.find(i => i.name === bmName);
        if (!maker) return;
        const prevBetEnable = maker.betable;
        maker.betable = enable;

        if (!prevBetEnable && maker.betable) {
            this.startBookmakerBet(maker);
        }

    }

    startBookmakerBet(bookmaker: KOBookmaker) {

        const isFree = !this.oddsOnBet.has(bookmaker.name);
        if (isFree) {
            const hasOddsOnWait = this.oddsOnWait.values().find(i => i.bookmaker === bookmaker.name);
            if (hasOddsOnWait) {
                console.log('next bet', bookmaker.name);
                this.nextBet(bookmaker.name);
            }
        }

    }

    nextBet(makerName: string, placedBet?: KOBet, error?: string) {
        if (placedBet) {
            const odds = this.oddsOnBet.get(makerName);
            this.addToBetPlacedHistory({ ...odds, ...placedBet, error: error });
            //place success
            if (placedBet.placedStake) {
                this.postBet(placedBet);
            }

            //remove those odds has placed on the same market
            const discardItems = this.oddsOnWait.values().filter(i => this.skipBetOddsIfBettedOrSomeConditions(i));
            for (const item of discardItems) {
                this.oddsOnWait.delete(item);
            }
        }

        this.oddsOnBet.delete(makerName);
        const bookmaker = this.bookmakers.find(i => i.name === makerName);

        if (!bookmaker || !bookmaker.betable) return;

        const nextOdds = this.oddsOnWait.values().find(i => i.bookmaker === makerName);

        if (!nextOdds) return;

        this.oddsOnWait.delete(nextOdds);


        const { 'user.site.extensions': siteExtensions } = Settings.getUserSettings();

        let url = nextOdds.url;
        try {
            const ext = siteExtensions[nextOdds.bookmaker];
            if (ext) {
                url = util.changeDomainExtension(nextOdds.url, ext);
            }
        } catch (error) {
            console.error(error);
        }
        const nextOddsToBet: KOOddsWithOption = {
            ...nextOdds, betTime: Date.now(), fixedReturns: this.fixedReturns, roundDownDigit: this.roundDownDigit,
            url: url
        };

        this.oddsOnBet.set(makerName, nextOddsToBet);

        console.log('next bet', makerName, nextOddsToBet);


        this.emit(MsgTypes.TryBet, makerName, nextOddsToBet);
    }

    postBet(placedBet: KOBet) {
        iohttp.post('/bet', true, { bet: placedBet }).then(({ code, res }) => {
            if (code !== 200) {
                this.betPostErrorNos++;
            }
            else {
                this.betPostErrorNos = 0;
            }
            if (this.betPostErrorNos >= MAX_BET_POST_ERROR) {
                this.emit(MsgTypes.BetPostError, this.betPostErrorNos);
            }
        });
    }

    skipBetOddsIfBettedOrSomeConditions(valueOdds: KOOdds) {
        const bets = this.placedBets;
        const successBets = bets.filter(i => i.placedStake);

        const bettedItems = successBets.filter(i =>
            !!i.placedStake
            && i.isLive === valueOdds.isLive
            && (
                (['greyhound', 'horse-racing'].includes(valueOdds.sport) === false && i.muuid === valueOdds.muuid)
                || (['greyhound', 'horse-racing'].includes(valueOdds.sport) && i.suuid === valueOdds.suuid)
            )
        );

        let betted = bettedItems.length > 0;

        if (betted && this.rebetOddsFluctuation && valueOdds.marketType === 'ASIAN_HANDICAP') {
            betted = bettedItems.some(i =>
                i.marketType === 'ASIAN_HANDICAP'
                && Math.abs((i.placedOdds || i.odds) - valueOdds.odds) < this.rebetOddsFluctuation!);

        }

        if (betted) return true;

        const errorBets = bets.filter(i => !i.placedStake);
        //for errors, we allow multiple error happen
        const errorBetsOnSameSel = errorBets.filter(i => i.uuid === valueOdds.uuid);
        const recipetErrBet = errorBetsOnSameSel.find(i => !!i.error && i.error === 'RecieptNotFound');
        if (recipetErrBet) return true;

        return errorBetsOnSameSel.length > (valueOdds.isLive ? 5 : 3);
    }

    addToBetPlacedHistory(bet: KOBet & { error?: string }) {

        const betdata = { ...bet };
        delete betdata['baseBookmaker'];
        delete betdata['baseMarketType'];
        delete betdata['baseEventId'];
        delete betdata['baseMarketId'];
        delete betdata['baseSelectionName'];
        delete betdata['baseSelectionId'];
        delete betdata['baseOdds'];
        delete betdata['baseLiquility'];
        delete betdata['baseHandicap'];

        this.placedBets.push(betdata);
        electionRemote.writeJson(this.betPlacedFile, betdata);
    }

    public async listBetHistory(criteria: PlacedBetSearchCriteria) {
        try {
            const { res, code } = await iohttp.get('/bet/listwithsummary', true, { ...criteria });

            if (code !== 200) return null;

            return res as PlacedBetSearchResult;

        } catch (error) {
            console.error(error);
            return null;
        }
    }

}