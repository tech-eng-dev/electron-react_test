import BackendStatus from "../actions/BackendStatus";
import { Middleware, MiddlewareAPI, Dispatch } from 'redux';

const errorHandler: Middleware = ({ dispatch }: MiddlewareAPI) => (
  next: Dispatch
) => action => {
  try {
    return next(action);
  }
  catch (err) {
    console.error('Caught an exception!', err);
    dispatch({ type: BackendStatus.error, payload: err.message || err });
  }
}

export default errorHandler;