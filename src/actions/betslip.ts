import { electionRemote, Settings, iohttp } from '../services';
import moment from 'moment';
import { AppReduxState, ThunkResult, KOBetLog } from '../models';
export const ActionTypes = {
    updateAccountLoginStatus: 'betslip-account-login-status-update',
    updateBalance: 'update-balance',
    writeBetLog: 'write-bet-log',
    clearBetLog: 'clear-bet-log',
    clearAccountStatus: 'clear-account-status',

};

export function writeBetLog(log: KOBetLog): ThunkResult<void> {
    return (dispatch: Function, getState: () => AppReduxState) => {

        const oddsPanel = Settings.getAppSettings()['betplayer.oddsPanel'];
        if (oddsPanel) {
            electionRemote.log('betslip', log);
            dispatch({ type: ActionTypes.writeBetLog, payload: { time: moment().format('MMDD HH:mm:ss'), ...log } });
        }
        iohttp.post('/log/bet',true, { log });
    }
}
export function clearBetLogs(): ThunkResult<void> {
    return (dispatch: Function, getState: () => AppReduxState) => {
        dispatch({ type: ActionTypes.clearBetLog });
    };
}

export function updateAccountLoginStatus(bookmaker: string, username: string,
    logged: boolean, error?: string): ThunkResult<void> {
    return (dispatch: Function, getState: () => AppReduxState) => {
        dispatch({ type: ActionTypes.updateAccountLoginStatus, payload: { bookmaker, username, logged, error } });
    }
}
export function clearAccountStatus(): ThunkResult<void> {
    return (dispatch: Function, getState: () => AppReduxState) => {
        dispatch({ type: ActionTypes.clearAccountStatus });
    }
}
export function updateBalance(bookmaker: string, balance: string): ThunkResult<void> {
    return (dispatch: Function, getState: () => AppReduxState) => {
        dispatch({ type: ActionTypes.updateBalance, payload: { bookmaker, balance } });
    }
}
