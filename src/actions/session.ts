import { ThunkResult,AppStatusItem } from '../models';
export const ActionTypes = {
    updateStatus: 'session.status.update',
    forceRefresh: 'session.forceRefresh'
};
export function updateStatus(status:AppStatusItem): ThunkResult<void> {
    return (dispatch: Function) => {
        dispatch({ type: ActionTypes.updateStatus, payload: status });
    }
}
export function forceRefresh(): ThunkResult<void> {
    return (dispatch: Function) => {
        dispatch({ type: ActionTypes.forceRefresh });
    }
}
