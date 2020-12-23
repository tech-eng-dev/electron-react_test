import React, { Component } from 'react';
import { connect } from 'react-redux';
import Button from '@material-ui/core/Button';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import AppBar from '@material-ui/core/AppBar';
import Typography from '@material-ui/core/Typography';

import { withRouter, RouteComponentProps } from 'react-router-dom';
import { auth, session } from '../../actions';
import { StyleSheet, css } from 'aphrodite';
import { Admin, AdminMsgTypes } from '../../services';
import { AlertDialog } from '../../components';
import AppStyles from '../../styles';
import ServerSettings from './ServerSettings';
import ServerClients from './ServerClients';
import ProfitLoss from './ProfitLoss';
import OddsBoard from './OddsBoard';
import {
    KOServerSettings,
    KOServerClient,
    AppStatusItem,
    AppUser,
    KOUser,
    KOOdds,
    ValueOddsThresholdOptions,
    KOBookieEvent,
    BetProfitCriteria
} from '../../models';
import { AppDispatch } from '../../reducers/store';
import UserManager from './UserManager';
import OpenEvent from './OpenEvent';

export interface Props extends RouteComponentProps {
    updateAppStatus: (appstatus: AppStatusItem) => void;
    logout: () => void;
    dispath: () => void;
    user: AppUser;
};
interface States {
    selectedTab: number;
    capacity: number;
    alert: string | null;
    serverSettings: KOServerSettings | null,
    serverClients: KOServerClient[],
    serverOpenEvents: KOBookieEvent[],
    valueOddsList: KOOdds[];
    valueOddsListForDisplay: KOOdds[];
    userList: KOUser[];
};

class AdminContainer extends Component<Props, States> {
    state: States = {
        selectedTab: 0,
        capacity: 0,
        alert: null,
        serverSettings: null,
        serverClients: [],
        serverOpenEvents: [],
        valueOddsList: [],
        valueOddsListForDisplay: [],
        userList: []
    };
    private admin: Admin;
    constructor(props: Props) {
        super(props);
        this.admin = new Admin();

        this.admin.on(AdminMsgTypes.JoinFailure, this.onJoinFailure);
        this.admin.on(AdminMsgTypes.JoinSuccess, this.onJoinSuccess);

        this.admin.on(AdminMsgTypes.LocalSettingUpdate, this.onSettingsUpdate);
        this.admin.on(AdminMsgTypes.LocalClientUpdate, this.onClientsUpdate);
        this.admin.on(AdminMsgTypes.LocalOpenEventUpdate, this.onOpenEventsUpdate);
        this.admin.on(AdminMsgTypes.LocalValueOdds, this.onValueOddsUpdate);
        this.admin.on(AdminMsgTypes.LocalValueOddsForDisplay, this.onValueOddsUpdateForDisplay);

        this.admin.on(AdminMsgTypes.UserList, this.onValueUsersUpdate);
    }
    componentDidMount() {
        console.log('admin:componentDidMount');
        this.admin.start().then(success => {
            if (!success) {
                this.logout('can not connect to server');
            }
        });
    }
    componentWillUnmount() {
        console.log('admin:componentWillUnmount');
        this.admin.removeAllListeners();
        this.admin.stop();
    }


    onJoinSuccess = () => {
        console.log('onJoinSuccess');
        const { updateAppStatus } = this.props;

        updateAppStatus && updateAppStatus({ key: 'bet-join', label: 'Joined', content: 'Success' });

        this.setState({ selectedTab: 0 });

    }
    onJoinFailure = (reason: string) => {
        const { updateAppStatus } = this.props;
        updateAppStatus && updateAppStatus({ key: 'bet-join', label: 'Joined', content: 'Failure' });
        this.showAlertMessage('Join to Server failure:' + (reason || ''));
    }
    onSettingsUpdate = (settings: KOServerSettings) => {
        this.setState({ serverSettings: settings });
    }
    onOpenEventsUpdate = (events: KOBookieEvent[]) => {
        this.setState({ serverOpenEvents: events });
    }
    onClientsUpdate = (clients: KOServerClient[]) => {
        this.setState({ serverClients: clients });
    }

    onValueOddsUpdate = (valueOdds: KOOdds[]) => {
        this.setState({ valueOddsList: valueOdds });
    }
    onValueOddsUpdateForDisplay = (valueOdds: KOOdds[]) => {
        this.setState({ valueOddsListForDisplay: valueOdds });
    }

    onValueUsersUpdate = (users: KOUser[]) => {
        console.debug('UsersUpdate', users);
        this.setState({ userList: users });
    }
    onServerSettingSave = async (settings: KOServerSettings) => {
        const { code } = await this.admin.saveSettings(settings);
        if (code === 200) {
            this.showAlertMessage('save success');
            this.setState({ serverSettings: settings });
        }
    }
    onOddsThreholdsUpdate = async (oddsThresholds: { live: ValueOddsThresholdOptions, prematch: ValueOddsThresholdOptions }, usage: 'bet' | 'display') => {
        const settings = this.state.serverSettings;

        let newSettings: KOServerSettings = { ...settings! };
        if (usage === 'bet') {
            newSettings.live.valueOddsThresholds = oddsThresholds.live;
            newSettings.prematch.valueOddsThresholds = oddsThresholds.prematch;
        }

        if (usage === 'display') {
            newSettings.live.valueOddsThresholdsForDisplay = oddsThresholds.live;
            newSettings.prematch.valueOddsThresholdsForDisplay = oddsThresholds.prematch;
        }

        const { code } = await this.admin.saveSettings(newSettings);
        if (code === 200) {
            this.showAlertMessage('save success');
            this.setState({ serverSettings: newSettings });
        }
    }

    onServerUser = async (user: Partial<KOUser>) => {
        const { code, res: userWithId } = await this.admin.saveUser(user);
        if (code === 200) {
            this.setState({ userList: [userWithId, ...this.state.userList] });
        }
        else {
            this.showAlertMessage('save error');
        }
    }
    onServerUserUpdate = async (user: Partial<KOUser>) => {
        const { code } = await this.admin.updateUser(user);
        if (code === 200) {
            const userList = this.state.userList;
            const oldUserIndex = userList.findIndex(i => i.id === user.id);
            if (oldUserIndex >= 0) {
                userList.splice(oldUserIndex, 1, user as KOUser);
                this.setState({ userList: [...userList] });
            }
        }
        else {
            this.showAlertMessage('update error');
        }
    }
    onServerUserRemove = async (uid: number) => {
        const { code } = await this.admin.removeUser(uid);

        if (code === 200) {
            const userList = this.state.userList;
            const oldUserIndex = userList.findIndex(i => i.id === uid);
            if (oldUserIndex >= 0) {
                userList.splice(oldUserIndex, 1);
                this.setState({ userList: [...userList] });
            }
        }
        else {
            this.showAlertMessage('remove error');
        }
    }
    onRefreshUsers = () => {
        this.admin.getUsers();
    }


    onRefreshBets = async (criteria: BetProfitCriteria) => {
        return await this.admin.refreshBets(criteria);
    };

    onTabChanged = (event: any, value: number) => {
        this.setState({ selectedTab: value });
    }
    logout = (reason?: string) => {
        const { logout, updateAppStatus } = this.props;
        logout && logout();
        updateAppStatus && updateAppStatus({
            key: 'bet-join',
            label: !reason ? undefined : 'reason',
            content: !reason ? undefined : reason
        });

    }

    showAlertMessage(message: string) {
        this.setState({ alert: message });
    }

    render() {
        const { user } = this.props;

        const { serverSettings, selectedTab, serverClients, serverOpenEvents,
            valueOddsListForDisplay, valueOddsList, userList: usersList } = this.state;
        if (!serverSettings) return null;

        return (
            <div className={css(styles.container)}>
                <AppBar position="static" color='primary'>
                    <div style={{ display: 'flex', marginLeft: 15, marginRight: 15, justifyContent: 'space-between', alignItems: 'center', padding: '5px' }}>

                        <div>
                            <Typography variant="body1"
                                style={{ marginRight: '30px' }}
                                color="inherit">{user.username || ''}</Typography>
                        </div>
                        <div>
                            <Button size="small" color="inherit" onClick={() => this.logout()}>Logout</Button>
                        </div>
                    </div>
                </AppBar>
                < Tabs classes={{ root: css(styles.tabsRoot) }}
                    value={selectedTab}
                    onChange={this.onTabChanged}>
                    {['Server Settings', 'Clients', 'Open Events', 'Profit / Loss', 'Value Odds', 'Value Odds (Display Only)', 'User Management']
                        .map((name, index) => {
                            return (<Tab key={name}
                                classes={{ root: css(styles.tabRoot), label: css(styles.tabLabel) }}
                                label={name} />);
                        })}
                </Tabs>
                <div style={{ flex: 1, position: 'relative' }}>
                    <div className={css(AppStyles.absolute)}
                        style={{
                            backgroundColor: '#fff', width: '100%', height: '100%',
                            display: 'flex', zIndex: this.state.selectedTab === 0 ? 20 : 1
                        }}>
                        <ServerSettings settings={serverSettings} onSave={this.onServerSettingSave} />
                    </div>
                    <div className={css(AppStyles.absolute)}
                        style={{
                            backgroundColor: '#fff', width: '100%', height: '100%',
                            display: 'flex', zIndex: this.state.selectedTab === 1 ? 20 : 1
                        }}>
                        <ServerClients clients={serverClients} />
                    </div>
                    <div className={css(AppStyles.absolute)}
                        style={{
                            backgroundColor: '#fff', width: '100%', height: '100%',
                            display: 'flex', zIndex: this.state.selectedTab === 2 ? 20 : 1
                        }}>
                        <OpenEvent events={serverOpenEvents} />
                    </div>
                    <div className={css(AppStyles.absolute)}
                        style={{
                            backgroundColor: '#fff', width: '100%', height: '100%',
                            display: 'flex', zIndex: this.state.selectedTab === 3 ? 20 : 1
                        }}>
                        <ProfitLoss
                            onRefreshBets={this.onRefreshBets}
                        />
                    </div>
                    <div className={css(AppStyles.absolute)}
                        style={{
                            backgroundColor: '#fff', width: '100%', height: '100%',
                            display: 'flex', zIndex: this.state.selectedTab === 4 ? 20 : 1
                        }}>
                        <OddsBoard valueOddsList={valueOddsList}
                            oddsThresholds={{ live: serverSettings.live.valueOddsThresholds, prematch: serverSettings.prematch.valueOddsThresholds }}
                            onOddsThresholdsUpdated={this.onOddsThreholdsUpdate} usage='bet' />
                    </div>

                    <div className={css(AppStyles.absolute)}
                        style={{
                            backgroundColor: '#fff', width: '100%', height: '100%',
                            display: 'flex', zIndex: this.state.selectedTab === 5 ? 20 : 1
                        }}>
                        <OddsBoard valueOddsList={valueOddsListForDisplay}
                            oddsThresholds={{
                                live: serverSettings.live.valueOddsThresholdsForDisplay,
                                prematch: serverSettings.prematch.valueOddsThresholdsForDisplay
                            }}
                            onOddsThresholdsUpdated={this.onOddsThreholdsUpdate} usage='display' />
                    </div>

                    <div className={css(AppStyles.absolute)}
                        style={{
                            backgroundColor: '#fff', width: '100%', height: '100%',
                            display: 'flex', zIndex: this.state.selectedTab === 6 ? 20 : 1
                        }}>
                        <UserManager users={usersList}
                            onUserRemove={this.onServerUserRemove}
                            onUserUpdate={this.onServerUserUpdate}
                            onUserAdd={this.onServerUser}
                            onRefershUsers={this.onRefreshUsers} />
                    </div>
                </div>
                {
                    !!this.state.alert &&
                    <AlertDialog message={this.state.alert} onClosed={() => this.setState({ alert: null })} />
                }

            </div >
        );
    }
}


export default withRouter(connect(
    (state) => ({}),
    (dispatch: AppDispatch) => ({
        logout: () => { dispatch(auth.logout()) },
        updateAppStatus: (status: AppStatusItem) => { dispatch(session.updateStatus(status)) }
    })
)(AdminContainer));

const styles = StyleSheet.create({
    container:
    {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%'
    },
    tabPos:
    {

    },
    tabsRoot:
    {
        minHeight: 30
    },
    tabRoot:
    {
        minHeight: 30,
        fontSize: '0.65rem'
    },
    tabLabel: {
        fontSize: '0.75rem'
    },


});