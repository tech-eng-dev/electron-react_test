
import BackendStatus from '../actions/BackendStatus';
import { ReduxAction } from '../models';
export interface State {
    status: string;
    error?: string;
}
export default function globalState(state: State = { status: 'loaded', error: undefined }, action: ReduxAction) {
    let nextState: State = state;
    switch (action.type) {
        case BackendStatus.loading:
            nextState = { ...state, status: 'loading' };
            break;
        case BackendStatus.loaded:
            nextState = { ...state, status: 'loaded', error: undefined };
            break;
        case BackendStatus.error:
            const error = action.payload;
            const status = !!error ? 'error' : 'loaded';
            nextState = { ...state, status, error: action.payload };
            break;
        default:
            nextState = state;
            break;
    }
    return nextState;
}