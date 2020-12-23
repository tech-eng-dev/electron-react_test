import React, { Component } from 'react';
import { connect } from 'react-redux';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { auth, session } from '../../actions';
import { StyleSheet, css } from 'aphrodite';
import { BetPlayer, BetMsgTypes, Settings } from '../../services';
import { AlertDialog, } from '../../components';
import Grabber from './Grabber';
import Betslip from './Betslip';
import SettingsDialog from './SettingsDialog';
import { KOEventForGrab, AppStatusItem, AppUser, KOGrabSweet } from '../../models';
import { AppDispatch } from '../../reducers/store';

export interface Props extends RouteComponentProps {
    updateAppStatus: (status: AppStatusItem) => void;
    logout: () => void;
    dispatch: AppDispatch;
    user: AppUser;
}
interface States {
    selectedTab: number;
    settingsOpen: boolean;
    showGrabber: boolean;
    devToolOpen: boolean;
    grabEvents: KOEventForGrab[];
    playerReady: boolean;
    alert: string | null;
}
/**
 * @augments {Component<{playerSettings:any,updateAppStatus:Function,logout:Function, dispatch:Function,user:any},>}
 */
class BetPlayerContainer extends Component<Props, States> {
    state: States = {
        grabEvents: [],
        selectedTab: 0,
        alert: null,
        settingsOpen: false,
        showGrabber: false,
        devToolOpen: false,
        playerReady: false,
    };
    private betPlayer: BetPlayer;
    constructor(props: Props) {
        super(props);
        this.betPlayer = new BetPlayer();

        this.betPlayer.on(BetMsgTypes.JoinFailure, this.onJoinFailure);
        this.betPlayer.on(BetMsgTypes.JoinSuccess, this.onJoinSuccess);

        this.betPlayer.on(BetMsgTypes.NextGrabEvent, this.onNextScrab);
        this.betPlayer.on(BetMsgTypes.GrabEventInvalid, this.onGrabEventInvalid);

    }
    componentDidMount() {
        console.log('betplayer:componentDidMount');
        this.betPlayer.start().then((success) => {
            if (success) {
                this.setState({ playerReady: true });
            }
            else {
                this.logout('can not connect to server');
            }
        });

    }
    componentWillUnmount() {

        console.log('betplayer:componentWillUnmount');
        this.betPlayer.removeAllListeners();
        this.betPlayer.stop();
    }
    onJoinSuccess = () => {
        console.log('onJoinSuccess');
        const { updateAppStatus } = this.props;

        updateAppStatus && updateAppStatus({ key: 'bet-join', label: 'Joined', content: 'Success' });

        this.setState({ grabEvents: [], selectedTab: 0 });

    }
    onJoinFailure = (reason: string) => {
        const { updateAppStatus } = this.props;
        updateAppStatus && updateAppStatus({ key: 'bet-join', label: 'Joined', content: 'Failure' });
        this.showAlertMessage('Join to Server failure:' + (reason || ''));
    }

    onGrabEventInvalid = (event: KOEventForGrab) => {
        console.log('onGrabEventInvalid', event);
        const { grabEvents } = this.state;
        const newGrabs = grabEvents.filter(i => i.uuid !== event.uuid);
        this.setState({
            grabEvents: newGrabs,
            selectedTab: newGrabs.length < this.state.selectedTab ? this.state.selectedTab : 0
        });
    }

    onNextScrab = (event: KOEventForGrab) => {
        console.log('onNextScrab', event);
        const { grabEvents: prevEvents } = this.state;
        this.setState({ grabEvents: [...prevEvents, event] });
    }

    onEventDataGrab = (data: { grab: KOGrabSweet, error?: string }) => {
        console.log('onEventDataGrab', data)
        this.betPlayer.sendGrabData(data);

    }

    openSettingsDialog = () => {
        this.setState({ settingsOpen: true });
    }
    onTabChanged = (event: React.ChangeEvent<{}>, value: number) => {
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
    toggleDevTools = () => {
        this.setState({ devToolOpen: !this.state.devToolOpen });
    }
    toggleGrabber = () => {
        const { showGrabber } = this.state;
        const nextShowGrabber = !showGrabber;
        this.setState({ showGrabber: nextShowGrabber, selectedTab: nextShowGrabber ? 1 : 0 });
    }

    onSettingsSaved = () => {
        const { dispatch } = this.props;
        dispatch(session.forceRefresh());
    }
    showAlertMessage(message: string) {
        this.setState({ alert: message });
    }

    render() {
        const { user } = this.props;

        const { grabEvents, selectedTab, showGrabber } = this.state;
        return (
            <div className={css(styles.container)}>
                <AppBar position="static" color='primary'>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px' }}>
                        <div>
                            {
                                (Settings.getAppSettings()['common.debug']) && <React.Fragment>
                                    <Button size="small" color="inherit" onClick={this.toggleGrabber}>
                                        Toggle Grabber
                                    </Button>
                                </React.Fragment>
                            }

                            <Button style={{ marginLeft: 30 }} variant="contained"
                                size="small" color="secondary" onClick={this.openSettingsDialog}>
                                Settings
                            </Button>

                        </div>

                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1"
                                style={{ marginRight: '30px' }}
                                color="inherit">{user.username || ''}</Typography>
                            <Button size="small" color="inherit" onClick={() => this.logout()}>Logout</Button>
                        </div>
                    </div>
                </AppBar>
                {showGrabber && < Tabs classes={{ root: css(styles.tabsRoot) }}
                    value={selectedTab}
                    onChange={this.onTabChanged}>
                    <Tab style={{ color: 'red' }} classes={{
                        root: css(styles.tabRoot),
                        label: css(styles.tabLabel)
                    }} label="Betslip">
                    </Tab>
                    <Tab style={{ color: 'red' }} classes={{
                        root: css(styles.tabRoot),
                        label: css(styles.tabLabel)
                    }} label="Grabber">
                    </Tab>
                </Tabs>
                }
                <div style={{ flex: 1, position: 'relative' }}>
                    <div style={{
                        position: 'absolute',
                        right: 0, top: 0, left: 0, bottom: 0, background: '#fff',
                        display: 'flex', zIndex: this.state.selectedTab === 0 ? 1 : 2
                    }}>
                        <Grabber events={grabEvents} hidden={!showGrabber} onDataGrab={this.onEventDataGrab} />
                    </div>
                    <div style={{
                        position: 'absolute',
                        right: 0, top: 0, left: 0, bottom: 0, background: '#fff',
                        display: 'flex', zIndex: this.state.selectedTab === 0 ? 2 : 1
                    }}>
                        <Betslip ready={this.state.playerReady} />
                    </div>
                </div>
                {
                    !!this.state.alert &&
                    <AlertDialog message={this.state.alert} onClosed={() => this.setState({ alert: null })} />
                }
                {
                    this.state.settingsOpen &&
                    <SettingsDialog onClosed={() => this.setState({ settingsOpen: false })} onSaved={this.onSettingsSaved} />
                }
            </div>
        );
    }
}

export default withRouter(connect(
    (state) => ({}),
    (dispatch: AppDispatch) => ({
        logout: () => { dispatch(auth.logout()) },
        updateAppStatus: (status: AppStatusItem) => { dispatch(session.updateStatus(status)) }
    })
)(BetPlayerContainer));


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