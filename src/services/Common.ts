import { KOOdds, KOOddsSweet, KOServerBet } from "../models";
import moment from "moment";
import { util } from ".";
import * as randomUA from 'random-useragent';

export const BookmakerList = ['bet365', 'netbet', 'paddypower', 'supabets', 'unibet'];
export const SportList = ['football', 'tennis', 'horse-racing', 'greyhound'];
export const BetModes: ('prematch' | 'live')[] = ['prematch', 'live'];
export const ExternalBookmakerList = ['pinnacle', 'betfair'];

export const PlayerSportList = ['tennis','football'];
export const PlayerBetModes: ('prematch' | 'live')[] = ['live','prematch'];

export const SweetOddsToValueOdds = (sweetOdds: KOOddsSweet): KOOdds => {

    const { bm, spt, eid, ena, etm, mid, mtp, sid, sna, hd, lve, bbm, url, bmtp, bhd, bsna, ods, beid, bmid, bods, blq, bsid, ocr } = sweetOdds;
    const euuid = `${ena}-${moment(etm).format('YYYYMMDDHHmm')}-${bm}-${lve ? 'live' : 'prematch'}`;
    const marketIdentity = `${mtp}-${hd}`;
    const baseMarketIdentity = `${bmtp}-${bhd}`;
    const odds: KOOdds = {
        uuid: `${euuid}-${marketIdentity}-${sna}-${bbm}-${baseMarketIdentity}-${bsna}`,
        bookmaker: bm,
        sport: spt,
        eventId: eid,
        eventName: ena,
        eventTime: etm,
        euuid: euuid,
        marketId: mid,
        marketType: mtp,
        handicap: hd,
        selectionId: sid,
        selectionName: sna,
        suuid: `${euuid}-${marketIdentity}-${sna}`,
        muuid: `${euuid}-${marketIdentity}`,
        odds: ods,
        isLive: lve,
        occurAt: ocr,
        url: url,
        baseBookmaker: bbm,
        baseEventId: beid,
        baseMarketType: bmtp,
        baseMarketId: bmid,
        baseHandicap: bhd,
        baseLiquility: blq,
        baseOdds: bods,
        baseSelectionId: bsid,
        baseSelectionName: bsna
    }
    return odds;
};

export const isCrossBet = (item: KOServerBet | KOOdds) => {

    try {
        if (item.marketType !== item.baseMarketType) return true;

        const uName1 = item.selectionName.toUpperCase();
        const uName2 = item.baseSelectionName.toUpperCase();

        return item.marketType === item.baseMarketType
            && !(uName1.includes(uName2) || uName2.includes(uName1))
            &&
            (
                (item.handicap === item.baseHandicap && item.marketType !== 'ASIAN_HANDICAP')
                || (
                    item.handicap !== null && item.baseHandicap !== null
                    && item.handicap === -item.baseHandicap && item.marketType === 'ASIAN_HANDICAP'
                )
            )
    } catch (error) {
        console.error(error);
        return false;
    }

};

export const getBetProfit = (bet: KOServerBet) => {
    if (!bet.checked) return Number.NaN;
    if (!bet.placedOdds || !bet.placedStake) return 0;

    if (bet.won === 0 || bet.won === 2) return 0;

    if (bet.won === 1) {
        return Math.round((bet.placedOdds - 1) * bet.placedStake * 100) / 100;
    }
    if (bet.won === -1) {
        return Math.round(-bet.placedStake * 100) / 100;
    }
    return 0;
}
export const getBetSummary = (bets: KOServerBet[]) => {
    if (!bets) return;
    let totalPL = 0, totalRollover = 0, totalRoi = 0, pendingBets = 0, won = 0, lost = 0;

    for (let i = 0; i < bets.length; i++) {
        const bet = bets[i];
        totalRollover = totalRollover + (!!bet.placedStake ? +bet.placedStake : 0);

        if (!bets[i].checked) {
            pendingBets++;
        }
        else {
            if (bet.won === 1) {
                won++;
            }
            else if (bet.won === -1) {
                lost++;
            }
            totalPL = totalPL + (getBetProfit(bet) || 0);

        }
    }

    totalRoi = util.financial(totalPL / totalRollover * 100);


    return {
        totalPL: util.financial(totalPL),
        totalRollover: util.financial(totalRollover),
        totalRoi, pendingBets, won,
        lost
    };
}



const BookmakerDeviceTypes: { [key: string]: 'desktop' | 'mobile' | 'desktopFix' } =
{
    'bet365': 'desktop', 'netbet': 'desktop',
    'supabets': 'desktop', 'paddypower': 'desktop',
    'unibet': 'desktopFix'
};
const BookmakerUA: { [boomaker: string]: string } = {};
export const getRandomUA = (bookmaker: string) => {
    if (!BookmakerUA[bookmaker]) {
        if (BookmakerDeviceTypes[bookmaker] === 'mobile') {
            BookmakerUA[bookmaker] = randomUA.getRandom(ua =>
                ['Chrome', 'Mobile Safari'].includes(ua.browserName) && ['mobile', 'tablet'].includes(ua.deviceType));
        }
        else if (BookmakerDeviceTypes[bookmaker] === 'desktopFix') {
            BookmakerUA[bookmaker] = randomUA.getRandom(ua =>
                ua.browserName === 'Chrome' && (+ua.browserMajor) === 48 && ua.deviceType === '' && ua.osName === 'Windows');
        }
        else {
            BookmakerUA[bookmaker] = randomUA.getRandom(ua =>
                ((ua.browserName === 'Chrome' && (+ua.browserMajor) > 48) || (ua.browserName === 'Firefox' && (+ua.browserMajor) > 40))
                && (ua.deviceType === '' && ua.osName === 'Windows'));
        }
    }
    return BookmakerUA[bookmaker];
}
