import { createStore, applyMiddleware } from 'redux';
import AppReducer from './app';
import { AppReduxState, ReduxAction } from '../models';
import errorHanlder from '../reduxMiddlewares/errorHanlder';
import thunk from '../reduxMiddlewares/thunk';
import { ThunkMiddleware } from 'redux-thunk';
const appStore = createStore(
    AppReducer,
    applyMiddleware(thunk as ThunkMiddleware<AppReduxState, ReduxAction>, errorHanlder)
)
export type AppState = ReturnType<typeof appStore.getState>

export type AppDispatch = typeof appStore.dispatch

export default appStore;