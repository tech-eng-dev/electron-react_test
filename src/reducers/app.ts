

import { combineReducers } from 'redux';
import auth from './auth';
import session from './session';
import backend from './backend';
import betslip from './betslip';
const appReducer = combineReducers({
    auth,
    session,
    backend,
    betslip

});
export default appReducer;