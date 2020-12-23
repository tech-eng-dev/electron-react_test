import { Middleware, MiddlewareAPI, Dispatch } from "redux";

const readyStatePromise: Middleware = ({ getState, dispatch }: MiddlewareAPI) => (
    next: Dispatch
) => action => {
   // console.warn('readyStatePromise',action,action.promise);
    if (!action.promise) {
        return next(action)
    }

    const makeAction = (ready: boolean, data?: any) => {
        const newAction = Object.assign({}, action, { ready }, data)
        delete newAction.promise
        return newAction
    }

    next(makeAction(false));
    return action.promise.then(
        (result: any) => next(makeAction(true, { result })),
        (error: any) => next(makeAction(true, { error }))
    )
}
export default readyStatePromise;