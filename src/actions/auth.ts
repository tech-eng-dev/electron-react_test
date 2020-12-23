import BackendStatus from './BackendStatus';
import { persistent, iohttp, AppContext } from '../services';
import { AppUser, AppReduxState, ThunkResult } from '../models';
import Redux from 'redux';
export const ActionTypes = {
    login: 'auth.login',
    loginKey: 'auth.loginKey',
    logout: 'auth.logout'
};

export function getPersistentUser() {
    return persistent.getUser();
}
export function login(username: string, key: string, anyValue?: object): ThunkResult<Promise<{ user?: AppUser, error?: string }>> {
    return async (dispatch: Function, getState: () => AppReduxState) => {

        dispatch({ type: BackendStatus.loading });

        const { res: { token, error } } = await iohttp.post('/login', false, { username, key, any_value: anyValue });

        dispatch({ type: BackendStatus.loaded });
        if (error || !token) {
            return { error: error.message || error };
        }

        const user: AppUser = { username, key, token };
        persistent.setUser(user);
        AppContext.setUser(user);

        dispatch({ type: ActionTypes.login, payload: user });
        return { user };

    }
}
export function checkIfLogged(): ThunkResult<boolean> {
    return (dispatch: Function) => {
        let user = persistent.getUser();

        if (user && user.token) {
            dispatch({ type: ActionTypes.login, payload: user });
            AppContext.setUser(user);
            return true;
        }
        return false;
    }
}

export function logout(reason?: string): ThunkResult<void> {
    return (dispatch: Redux.Dispatch) => {
        const user = persistent.getUser();
        if (user) {
            user.token = null;
        }
        persistent.setUser(user);
        AppContext.setUser(null);
        dispatch({ type: ActionTypes.logout });
        if (reason) {
            dispatch({ type: BackendStatus.error, payload: reason });
        }
    }
}