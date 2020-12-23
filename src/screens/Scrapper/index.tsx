import React from 'react';
import { connect } from 'react-redux';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { auth, session } from '../../actions';
import { StyleSheet, css } from 'aphrodite';
import { Scrapper, electionRemote, Settings, BetMsgTypes } from '../../services';
import { BookieWebView } from '../../components';
import { ScrapperBookmaker, WebviewIPCMsg, AppUser, IOMessage, AppStatusItem, WebviewContext } from '../../models';
import SettingsDialog from './SettingsDialog';
import { AppDispatch } from '../../reducers/store';
import CircleIndicator from '../../components/common/CircleIndicator';

declare type ScrapFeedback = { success: boolean, msg: string, time: Date };
export interface Props extends RouteComponentProps {
    updateAppStatus: (status: AppStatusItem) => void;
    logout: () => void;
    dispatch: AppDispatch;
    user: AppUser;
}
interface States {
    bookmakers: ScrapperBookmaker[];
    selectedTab: number;
    devToolOpen: boolean;
    settingsDialogOpen: boolean;
    scrapFeedbackList: ScrapFeedback[]
}
class ScrapperContainer extends React.Component<Props, States> {
    private readonly scrapper: Scrapper;
    private readonly ScrapTimers: Map<ScrapperBookmaker, number> = new Map();
    state: States = { bookmakers: [], selectedTab: 0, scrapFeedbackList: [], devToolOpen: false, settingsDialogOpen: false };
    constructor(props: Props) {
        super(props);
        this.scrapper = new Scrapper();
    }
    componentDidMount() {
        console.log('scrapper:componentDidMount');

        this.scrapper.on('next', this.onNextBookmakerScrap);
        this.scrapper.on(BetMsgTypes.JoinFailure, this.onJoinFailure);
        this.scrapper.on(BetMsgTypes.JoinSuccess, this.onJoinSuccess);

        this.scrapper.on('restart', () => {
            this.setState({ bookmakers: [] });
        });

        this.scrapper.start().then(success => {
            if (!success) {
                this.logout('can not connect to server');
            }
        });
    }
    onJoinSuccess = () => {
        console.log('onJoinSuccess');
        const { updateAppStatus } = this.props;

        updateAppStatus && updateAppStatus({ key: 'bet-join', label: 'Joined', content: 'Success' });

    }
    onJoinFailure = (reason: string) => {
        const { updateAppStatus } = this.props;
        updateAppStatus && updateAppStatus({ key: 'bet-join', label: 'Joined', content: 'Failure' });
    }

    onNextBookmakerScrap = (bookmaker: ScrapperBookmaker) => {
        const { bookmakers: prevWorkBookmakers } = this.state;

        const found = prevWorkBookmakers.find(i =>
            i.name === bookmaker.name
            && i.sport === bookmaker.sport
            && i.isLive === bookmaker.isLive);

        if (found) {
            prevWorkBookmakers.splice(prevWorkBookmakers.indexOf(found), 1, bookmaker);
        }
        else {
            prevWorkBookmakers.push(bookmaker);
        }
        console.log('onNextBookmakerScrap', prevWorkBookmakers);
        this.setState({ bookmakers: [...prevWorkBookmakers] });

        this.ScrapTimers.set(bookmaker, window.setTimeout(() => {
            this.showScrapResultMessage(bookmaker, { error: 'Timeout', msg_type: 'data-extraction' });
            this.goToNextScrap(bookmaker);
        }, 1e3 * 180));
    }

    componentWillUnmount() {
        console.log('scrapper:componentWillUnmount');

        this.ScrapTimers.forEach((val) => window.clearTimeout(val));
        this.ScrapTimers.clear();
        this.scrapper.removeListener('next', this.onNextBookmakerScrap);
        this.scrapper.stop();
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

    openSettingsDialog = () => {
        this.setState({ settingsDialogOpen: true });
    }
    onSettingsSaved = () => {
        const { dispatch } = this.props;

        dispatch(session.forceRefresh());
    }

    onWebViewIPC = async (sender: BookieWebView, msg: WebviewIPCMsg) => {
        const { data, context } = msg;
        const { bookie } = context as unknown as { bookmaker: string, bookie: ScrapperBookmaker, uuid: string };

        let result: IOMessage;
        if (data.msg_type !== 'data-extraction') return;

        if (!data.error && data.events) {
            result = await this.scrapper.sendDataToServer({
                events: data.events.map((i: any) => ({ ...i, bookmaker: (bookie as ScrapperBookmaker).name, isLive: bookie.isLive }))
            });
        }
        else {
            result = data;
            const { user } = this.props;
            electionRemote.log('scrapper', { user: user.username, ...result });
        }

        this.showScrapResultMessage(bookie, result);

        window.clearTimeout(this.ScrapTimers.get(bookie));
        this.goToNextScrap(bookie);
    }

    WebviewError = (context: WebviewContext, reason: string) => {
        if (reason === 'ProxyLoginTooMuchAttempts') {
            const { bookie } = context as unknown as { bookmaker: string, bookie: ScrapperBookmaker, uuid: string };
            this.showScrapResultMessage(bookie, { error: reason, msg_type: 'data-extraction' });

            window.clearTimeout(this.ScrapTimers.get(bookie));
            this.goToNextScrap(bookie);
        }
    }

    removeWebView(bookmaker: ScrapperBookmaker) {

        const { bookmakers } = this.state;
        const newBookmakers = bookmakers.filter(i => !(i.name === bookmaker.name && i.sport === bookmaker.sport && i.isLive === bookmaker.isLive));

        this.setState({ bookmakers: newBookmakers, selectedTab: 0 });
    }

    goToNextScrap(bookieForRemove: ScrapperBookmaker) {
        this.removeWebView(bookieForRemove);
        this.scrapper.next(bookieForRemove.isLive ? 'live' : 'prematch', bookieForRemove);
    }

    showScrapResultMessage(bookie: ScrapperBookmaker, result: IOMessage) {

        const feedbackList = [...this.state.scrapFeedbackList];
        const bookieInfo = `${bookie.name} ${bookie.sport} ${(bookie.isLive ? 'live' : 'prematch')}`;
        const msg = !result.error ? `${bookieInfo} events scrap success`
            : `${bookieInfo} scrap failure with ${result.error || ''}`;
        const feedback: ScrapFeedback = { success: !result.error, msg, time: new Date() };
        feedbackList.unshift(feedback);
        feedbackList.slice(0, 100);

        this.setState({ scrapFeedbackList: feedbackList });

    }


    render() {

        const { user } = this.props;
        const { bookmakers, selectedTab, devToolOpen, scrapFeedbackList } = this.state;
        return (
            <div className={css(styles.container)}>
                <AppBar position="static" color='primary'>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px' }}>
                        <div>
                            {(Settings.getAppSettings()['common.debug']) && (<Button size="small" color="inherit" onClick={this.toggleDevTools}>
                                {devToolOpen ? 'Close Debug Console' : 'Open Debug Console'}</Button>)}
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

                <Tabs classes={{ root: css(styles.tabsRoot) }}
                    value={selectedTab}
                    onChange={this.onTabChanged}>
                    {bookmakers.map(bookie => {
                        const uuid = bookie.name + '-' + bookie.sport + '-' + (bookie.isLive ? 'live' : 'prematch');
                        const proxyCountry = Settings.getProxyCountry(bookie.name);
                        return (<Tab
                            key={uuid}
                            classes={{
                                root: css(styles.tabRoot),
                                label: css(styles.tabLabel)
                            }}
                            label={
                                <div style={{ flexDirection: 'row', alignItems: 'center', display: 'flex' }}>
                                    <div>{!!proxyCountry ? `${uuid} (${proxyCountry})` : `${uuid}`}</div>
                                    {!!proxyCountry && <CircleIndicator color="green" size={10} />}
                                </div>
                            }
                        />);
                    })
                    }
                </Tabs>
                <div style={{ flex: 1, position: 'relative' }}>
                    {
                        bookmakers.map((bookie, index) => {
                            const uuid = bookie.name + '-' + bookie.sport + '-' + (bookie.isLive ? 'live' : 'prematch');
                            const proxyCountry = Settings.getProxyCountry(bookie.name);
                            return (
                                <div
                                    key={uuid}
                                    // web view issue conflic with aphrodite (no render at first load)
                                    //refer to https://github.com/electron/electron/issues/8505
                                    style={{
                                        position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                                        zIndex: selectedTab === index ? (bookmakers.length + 1) : index + 1
                                    }}>
                                    <BookieWebView
                                        session={uuid}
                                        context={{ bookmaker: bookie.name, usage: 'scrapper', bookie: bookie, uuid: uuid }}
                                        src={bookie.url}
                                        script={bookie.script}
                                        onIpcMsg={this.onWebViewIPC}
                                        proxyCountry={proxyCountry}
                                        onError={this.WebviewError}
                                        devToolOpen={selectedTab === index && devToolOpen} />
                                </div>);
                        })
                    }
                    {bookmakers.length === 0 && (<Typography variant="h5"
                        style={{ padding: 15, textAlign: 'center' }}>Event scrap finished,Waiting for Next Round Event Scrapping</Typography>)}
                </div>

                <div className={css(styles.msgContainer)}>
                    {
                        scrapFeedbackList.map((i, index) => {
                            return (<p key={index} className={css(i.success ? styles.msgItem : styles.msgItemWithError)}>
                                {`${i.time.toLocaleString()} ${i.msg}`}
                            </p>)
                        })
                    }
                </div>
                {
                    this.state.settingsDialogOpen &&
                    <SettingsDialog onClosed={() => this.setState({ settingsDialogOpen: false })} onSaved={this.onSettingsSaved} />
                }
            </div>
        )
    }
}

export default withRouter(connect(
    (state) => ({}),
    (dispatch: AppDispatch) => ({
        logout: () => dispatch(auth.logout()),
        updateAppStatus: (status: AppStatusItem) => { dispatch(session.updateStatus(status)) }
    })
)(ScrapperContainer));


const styles = StyleSheet.create({
    container:
    {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%'
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
    msgContainer: {
        height: 120,
        overflow: 'auto',
        fontSize: '0.75rem',
        boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 2px 1px -1px rgba(0,0,0,0.12)'
    },
    msgItem: {
        paddingLeft: 15,
        paddingRight: 15
    },
    msgItemWithError: {
        color: 'red',
        fontWeight: 'bold',
        paddingLeft: 15,
        paddingRight: 15
    }

});