import { ActionTypes } from '../actions/betslip';
import { ReduxAction, KOBetLog, AccountStatus } from '../models';
export interface State {
    accountStatus: AccountStatus,
    betLogList: KOBetLog[]
}
export default function betslip(
    state: State = { accountStatus: {}, betLogList: [] },
    action: ReduxAction) {
    let nextState: State = state;
    switch (action.type) {

        case ActionTypes.updateAccountLoginStatus:
            {

                const { bookmaker, username, logged, error } = action.payload;
                const accountStatus = { ...state.accountStatus };
                accountStatus[bookmaker] = { ...accountStatus[bookmaker], username, logged, error };
                nextState = { ...state, accountStatus };
            }
            break;
        case ActionTypes.updateBalance:

            if (action.payload) {
                const { balance, bookmaker } = action.payload;

                const accountStatus = { ...state.accountStatus };
                if (accountStatus[bookmaker]) {
                    accountStatus[bookmaker].balance = balance;
                    nextState = { ...state, accountStatus };
                }
            }
            break;
        case ActionTypes.writeBetLog:
            {
                const data = action.payload;
                const entries = [...state.betLogList];
                entries.unshift(data);
                nextState = { ...state, betLogList: entries };
            }
            break;
        case ActionTypes.clearBetLog:

            nextState = { ...state, betLogList: [] };

            break;
        case ActionTypes.clearAccountStatus:
            nextState = { ...state, accountStatus: {} };
            break;
        default:
            nextState = state;
            break;
    }
    return nextState;
}