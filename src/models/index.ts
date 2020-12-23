import { ThunkAction } from 'redux-thunk';

type OmitKO<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type Nullable<T> = T | undefined;
export type PruneModel<T, K> = Pick<T, Exclude<keyof T, keyof K>>
export type AccountStatus = {
    [bookmaker: string]:
    { username: string, logged: boolean, error: string, balance: string }
}
export type PlacedBetSearchCriteria = {
    from: number,
    to: number,
    page?: number;
    pagesize?: number;
    bookmakers?: string;
    sports?: string;
    usernames?: string;
    uid?: number;
    events?: string;
    markets?: string;
    summary_only?: boolean;
}
export type BetProfitCriteria = {
    from: number,
    to: number,
    page?: number;
    pagesize?: number;
    bookmakers?: string;
    sports?: string;
    usernames?: string;
    tags?: string;
    uid?: number;
    events?: string;
    markets?: string;
    ips?: string;
}
export type PlacedBetSearchResult = {
    bets: KOServerBet[],
    summary: { pl: number, rollover: number, totalBets: number, pendingBets: number, wonBets: number, lostBets: number, refundBets: number };
    info: { bookmakers: string[], users: string[], sports: string[] }
}
export type BetProfitSearchResult = {
    bets: KOServerBet[],
    profits: UserProfit[];
    info: { bookmakers: string[], users: string[], sports: string[], tags: string[] }
}
export type UserProfit = {
    userId: string, username: string, tags: string,
    pl: number, rollover: number, totalBets: number,
    pendingBets: number, wonBets: number, lostBets: number, refundBets: number
}
export type ProfitSummary = {
    pl: number, rollover: number,
    pendingBets: number, wonBets: number,
    lostBets: number, totalBets: number
}

export interface FixedIntervalTimer {
    tick?: number;
    cancelled: boolean;
}
export interface ReduxAction {
    type: string;
    payload: any;
}
export interface AppReduxState {
    session: any
}

export type ThunkResult<R> = ThunkAction<R, AppReduxState, undefined, ReduxAction>;


export type IOStatus = 'connected' | 'disconnected' | 'closed' |
    'connect_timeout' | 'error' | 'reconnecting' | 'reconnect_failed' | 'reconnect_error';

export interface AppStatusItem {
    label?: string;
    content?: string;
    key: string
}
export interface IOMessage {
    error?: string;
    msg_type: string;
    [key: string]: any;

}
export interface WebviewContext {
    usage: string;
    bookmaker: string;
    [key: string]: any;
}
export interface WebviewIPCMsg {
    data: IOMessage;
    context: WebviewContext;
}
export interface AppError {
    message: string;
}

export interface AppUser {
    username: string;
    key: string;
    token: string | null;
}
export interface UserSumOfPL {
    username: string;
    wins: number;
    loses: number;
}


export interface BookmakerCredential {
    name: string;
    username: string;
    password: string;
    homeUrl: string;
    loginUrl: string;
    active: boolean;
}
export interface ScrapperBookmaker {
    name: string,
    sport: string,
    url: string,
    script: string,
    active: boolean,
    isLive: boolean;
}

export interface UserSettings {
    "user.betplayer.modes": ('prematch' | 'live')[],
    "user.betplayer.credentials": { [bookmaker: string]: { username: string, password: string, active: boolean } },
    "user.betplayer.fixedReturns": number;
    "user.betplayer.roundDownDigit": number
    "user.site.extensions": { [bookmaker: string]: string },
    "user.proxies.countries": { [bookmaker: string]: string | undefined },
    "user.proxies.account": { username: string, password: string } | undefined,
    "user.proxies.turnOn": boolean,
    "user.betplayer.sports": string[],
    "user.betplayer.betOddsRange": [number, number],
    "user.betplayer.rebetOddsFluctuation": number | undefined
}

export interface AppSettings {

    "common.host": string;
    "common.port": number;
    "common.app": "betplayer" | 'scrapper' | 'admin' | 'test',
    "common.debug": boolean,
    "common.proxy": { host: string, port: number },
    "common.proxy.countries": string[],
    "scrapper.bookmakers": ScrapperBookmaker[],
    "scrapper.capacity": number,
    "scrapper.live.interval": number;
    "scrapper.prematch.interval": number;
    "site.extensions": { [bookmaker: string]: string[] },
    "betplayer.bookmakers": { name: string, homeUrl: string, loginUrl: string }[],
    //**don't set it at json setting file if false (security code) */
    "betplayer.oddsPanel": boolean,
    //**don't set it at json setting file if false (security code) */
    "betplayer.proxyFeatureTurnOn": boolean
}

export interface KOBookieEvent {
    id: number;
    uuid: string;
    eventName: string;
    bookmaker: string;
    sport: string;
    startTime: Date
    bfEventId: string;
    pinEventId: string;
    url: string;
    script: string;
    isLive: boolean;
    isClosed: boolean;
}
export interface KOScrapEvent {
    uuid: string;
    eventName: string;
    startTime: string;
    bookmaker: string;
    isLive: boolean;
    sport: string;
    url: string;
    script: string;
}


export interface KOEventForGrab {
    bfEventId: string;
    bookmaker: string;
    createdAt: string;
    eventName: string;
    id: number;
    isClosed: boolean;
    pinEventId: string;
    isLive: boolean;
    script: string;
    sport: string;
    startTime: string;
    updatedAt: string;
    url: string;
    uuid: string;
}

export interface KOBetLog {

    msg: string;
    data?: any,
    time?: string | Date

}

export interface KOGrabSelection {
    marketType: string;
    marketId: string;
    handicap: number;
    selectionId: string;
    selectionName: string;
    odds: number;
    url: string;

}

export interface KOGrabSweet {
    evt: KOGrabEventSweet
    updates?: KOSelectionSweet[],
    removes?: KOSelectionSweet[]
}
export interface KOGrabEventSweet {
    /**
       * event name
       */
    ena: string;
    /**
     * event time
     */
    etm: string;
    /**
     * event id
     */
    eid: string;
    /**
 * bookamker
 */
    bm: string;
    /**
     * sport 
     */
    spt: string;
    lve: boolean;
}
export interface KOSelectionSweet {

    /**
     * market type
     */
    mtp: string;
    /**
     * market id
     */
    mid: string;

    /**
     * selection id
     */
    sid: string;
    /**
     * selection name
     */
    sna: string;
    /**
     * handicap
     */
    hd: number | null
    /**
     * odds 
     */
    ods: number;

    url?: string;

}

export interface KOUser {
    id: number;
    username: string;
    key: string;
    capacity: number;
    disabled: boolean;
    tags: string;
}


/**
 * used to exchange data via socket, use it to reduce network data size
 */
export interface KOOddsSweet {
    /**
     * event Id
     */
    eid: string;
    /**
     * event name
     */
    ena: string;
    /**
     * event time
     */
    etm: Date;
    /**
     * market id
     */
    mid: string;
    /**
     * market type
     */
    mtp: string;
    /**
     * bookmaker
     */
    bm: string;
    /**
     * selection id
     */
    sid: string;
    /**
     * selection name
     */
    sna: string;
    /**
     * handicap
     */
    hd: number | null;
    /**
     * is live
     */
    lve: boolean;
    /**
     * odds
     */
    ods: number;
    /**
 * when the value odds appear
 */
    ocr: Date;
    /**
     * bet url
     */
    url: string;
    /**
     * sport
     */
    spt: string;

    /**
     * base odds
     */
    bods: number;
    /**
     * base selection id
     */
    bsid: string;
    /**
     * base market id
     */
    bmid: string;
    /**
     * base market type
     */
    bmtp: string;
    /**
     * base selection name
     */
    bsna: string;
    /**
     * base event id
     */
    beid: string;
    /**
     * base handicap
     */
    bhd: number | null;
    /**
     * base marekt bookmaker
     */
    bbm: string;
    /**
    * base liquility,if selection has liquility option (for betfair)
    */
    blq?: number
}
export interface KOOdds {
    uuid: string;

    /**
    * selection uuid cross all bookmakers
    */
    suuid: string;
    /**
     * market uuid cross all bookmakers
     */
    muuid: string;
    /**
    * event uuid cross all bookmakers
    */
    euuid: string;
    eventId?: string;

    eventName: string;
    eventTime: Date,
    isLive: boolean;

    marketId?: string;
    marketType: string;
    bookmaker: string;

    /**
     * can be used for BetLocator
     */
    selectionId: string;
    selectionName: string;
    handicap: number | null;

    odds: number;

    /**
     * when the value odds appear
     */
    occurAt: Date;

    url: string;
    sport: string;

    baseOdds: number;
    baseSelectionId: string;
    baseMarketId: string;
    baseEventId: string;
    baseBookmaker: string;
    baseHandicap: number | null;
    baseSelectionName: string;
    baseMarketType: string;
    /**
    * if selection has liquility option (for betfair)
    */
    baseLiquility?: number;
}

export interface KOOddsWithOption extends KOOdds {
    roundDownDigit: number;
    betTime: number;
    fixedReturns: number
}
export interface KOBet extends KOOddsWithOption {
    /**
     * if placedstake is falsy value, it represent place bet error
     */
    placedStake: number | null;
    placedOdds: number | null;
    placedReference: string | null;
}
export type KOBetWithoutBaseInfo = OmitKO<KOBet,
    'baseSelectionName' | 'baseMarketType' | 'baseHandicap' | 'baseBookmaker'
    | 'baseEventId' | 'baseOdds' | 'baseMarketId' | 'baseSelectionId' | 'baseLiquility'>;

export interface KOServerBet extends KOBet {
    /**
     * db id
     */
    id?: number;
    userId?: number;
    userIP?: string;
    username: string;
    /**
	 *0:unknown, 1:won, -1:lost, 2:refund (not win or lost)
	 */
    won?: number;
    checked?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface KOBookmaker {
    name: string;
    credential: BookmakerCredential;
    betable: boolean;
}

//----------------


export interface KOServerSettings {
    modes: ('prematch' | 'live')[],
    clientScrabCapacity: number;
    prematch: KOCommonSettings & {
        prematchBeforeInM: number;
        horsePrematchBeforeInM: number;
    }
    live: KOCommonSettings
}

export interface KOCommonSettings {
    betfairCredentials: { key: string, password: string, username: string };
    pinnacleCredentials: { password: string, username: string };
    betfairSelectionLiquidity: number;
    valueOddsAge: number;
    sports: string[];
    bookmakers: string[];
    externalBookmakers: string[];
    valueOddsThresholds: ValueOddsThresholdOptions,
    valueOddsThresholdsForDisplay: ValueOddsThresholdOptions
}
export interface OddsOptions { [odds: string]: number };
export interface ValueOddsThresholdOptions {
    "straight": {
        "betfair": OddsOptions,
        "pinnacle": OddsOptions
    },
    "cross": {
        "betfair": number,
        "pinnacle": number
    }
}


export interface KOServerClient {
    sid: string;
    uip: string;
    uname: string;
    appVer: string;
    grabbings: Array<KOBookieEvent>
}
