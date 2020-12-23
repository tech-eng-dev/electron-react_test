import { Dispatch, Middleware, MiddlewareAPI } from "redux";
import BackendStatus from "../actions/BackendStatus";

const thunk: Middleware = ({ getState, dispatch }: MiddlewareAPI) => (
    next: Dispatch
) => (action) => {
    try {
        const result = typeof action === 'function'
            ? action(dispatch, getState)
            : next(action);

        if (result && typeof result.then === 'function') {
            (result as Promise<any>).catch(err => next({ type: BackendStatus.error, payload: err.message || err }));
        }
        return result;

    } catch (err) {
        console.error(err);
        next({ type: BackendStatus.error, payload: err.message || err });
    }

}
export default thunk;