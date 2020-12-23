
import { ActionTypes } from '../actions/session';
import { ReduxAction, AppStatusItem } from '../models';
export interface State {
    statusItems: AppStatusItem[];
    forceRefreshTick: number
}
function session(
    state: State = { statusItems: [], forceRefreshTick: Date.now() },
    action: ReduxAction) {
    let nextState: State | undefined;
    switch (action.type) {
        case ActionTypes.updateStatus:
            if (action.payload) {
                const { key, label, content } = action.payload;
                const newItems = [...state.statusItems];
                const foundIndex = newItems.findIndex(i => i.key === key);
                if (foundIndex >= 0) {
                    if (label === null) {
                        newItems.splice(foundIndex, 1);
                    }
                    else {
                        newItems.splice(foundIndex, 1, { key, label, content });
                    }
                }
                else {
                    newItems.push({ key, label, content });
                }
                nextState = {
                    ...state, statusItems: newItems
                };
            }
            break;
        case ActionTypes.forceRefresh:
            nextState = {
                ...state, forceRefreshTick: Date.now()
            };
            break;
        default:
            break;
    }
    return nextState || state;
}

export default session;