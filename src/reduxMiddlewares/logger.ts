import { Dispatch, Middleware, MiddlewareAPI } from "redux";
import { ReduxAction } from "../models";

const logger :Middleware = ({ getState, dispatch }: MiddlewareAPI) => (
    next: Dispatch<ReduxAction>
) => (action: any) => {
    console.warn('logger',action,next);
    console.group(action.type);
    console.info('dispatching', action);
    let result = next(action);
    console.log('next state', getState());
    console.groupEnd();
    return result;
}
export default logger;