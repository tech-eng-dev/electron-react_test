import { Middleware, MiddlewareAPI, Dispatch } from "redux";
import BackendStatus from "../actions/BackendStatus";

const vanillaPromise: Middleware = ({ getState, dispatch }: MiddlewareAPI) => (
  next: Dispatch
) => action => {
  if (typeof action.then !== 'function') {
    return next(action);
  }

  return Promise.resolve(action).then(dispatch).catch(err=>{
    next({ type: BackendStatus.error, payload: err.message || err });
  });
}

export default vanillaPromise;