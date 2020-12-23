
import { ActionTypes } from '../actions/auth';
import { ReduxAction, AppUser } from '../models';
export interface State {
    user?: AppUser,
    logged: boolean
}
function auth(state: State = { user: undefined, logged: false }, action: ReduxAction) {
    let nextState: State | undefined;
    switch (action.type) {
        case ActionTypes.login:
            if (action.payload) {
                const user = action.payload;
                nextState = {
                    ...state, user, logged: true
                };
            }
            break;
        case ActionTypes.logout:
            nextState = { ...state, user: undefined, logged: false };
            break;
        default:
            break;
    }
    return nextState || state;
}

export default auth;