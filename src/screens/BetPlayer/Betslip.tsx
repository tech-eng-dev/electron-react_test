import React, { Component } from 'react';
import { connect } from 'react-redux';
import appStyles from '../../styles';

import Button from '@material-ui/core/Button';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import { betslip as betslipAction, auth } from '../../actions';
import { StyleSheet, css } from 'aphrodite';
import { Betslip, Settings, SlipMsgType } from '../../services';
import { BookieWebView, AlertDialog } from '../../components';
import BetOverview from './BetOverview';
import {
    KOOdds, KOBet,
    KOBookmaker, WebviewIPCMsg, KOBetLog, KOOddsWithOption, PlacedBetSearchCriteria, BookmakerCredential
} from '../../models';
import { AppDispatch } from '../../reducers/store';
import { Props as BetslipBrowserProps } from '../BetSlipBrowsers/BetslipBrowser';
import OddsBoard from '../Admin/OddsBoard';
import CircleIndicator from '../../components/common/CircleIndicator';
import BwinBrowser from '../BetSlipBrowsers/BwinBrowser';

export interface Props {
    ready: boolean;
    devToolOpen?: boolean;
    dispatch: AppDispatch;
}
interface States {
    selectedTab: number;
    devToolOpen: boolean;
    bookmakers: KOBookmaker[];
    valueOddsForBet: { bookmaker: string, valueOdds: KOOddsWithOption | null }[];
    displayValueOddsList: KOOdds[],
    valueOddsList: KOOdds[],
    alert?: string;
}

class BetslipContainer extends Component<Props, States> {

    state: States = {
        bookmakers: [],
        selectedTab: 0,
        devToolOpen: false,
        valueOddsForBet: [],
        valueOddsList: [],
        displayValueOddsList: [],
        alert: undefined
    };

    /**
  * key is the bookmaker name
  */
    oodsOnBetting: Map<string, any> = new Map();

    private betSlip: Betslip;

    constructor(props: Props) {
        super(props);

        this.betSlip = new Betslip();
        this.betSlip.on(SlipMsgType.bookmakerUpdate, this.onBookmakerUpdated);
        this.betSlip.on(SlipMsgType.TryBet, this.onTryBet);

        this.betSlip.on(SlipMsgType.OddsOnBetUpdated, this.onOddsOnBetUpdated);
        this.betSlip.on(SlipMsgType.BetTimeout, this.onBetTimeout);

        this.betSlip.on(SlipMsgType.valueOddsFromSever, this.onValueOddsFromServer)
        this.betSlip.on(SlipMsgType.displayOddsFromServer, this.onDisplayOddsFromServer);
        this.betSlip.on(SlipMsgType.BetPostError, this.onBetPostError);
    }

    componentDidMount() {

        console.log('betslip:componentDidMount');
        this.betSlip.start();
    }

    componentWillUnmount() {

        console.log('betslip:componentWillUnmount');
        const { dispatch } = this.props;
        dispatch(betslipAction.clearBetLogs());
        dispatch(betslipAction.clearAccountStatus());
        this.betSlip.removeAllListeners();
        this.betSlip.stop();
    }
    /**
     * @param makerName bookmaker name
     * @param  valueOdds
     */
    onTryBet = async (makerName: string, valueOdds: KOOddsWithOption) => {
        const { valueOddsForBet } = this.state;
        const newValueOddsForBet = [...valueOddsForBet];
        const item = newValueOddsForBet.find(i => i.bookmaker === makerName);
        if (item) {
            item.valueOdds = valueOdds;
        }
        else {
            newValueOddsForBet.push({ bookmaker: makerName, valueOdds });
        }
        console.warn('onTryBet', makerName, valueOdds);

        this.setState({ valueOddsForBet: newValueOddsForBet });
    }

    onOddsOnBetUpdated = (bookmaker: string, odds: KOOddsWithOption | null) => {

        console.warn('onOddsOnBetUpdated', bookmaker, !!odds, odds && odds.selectionName, odds && odds.odds);
        const { valueOddsForBet } = this.state;
        const news = [...valueOddsForBet];
        const item = news.find(i => i.bookmaker === bookmaker);
        if (item) {
            item.valueOdds = odds;
        }
        this.setState({ valueOddsForBet: news });
    }
    onBetTimeout = (bookmaker: string, odds: KOOdds) => {
        this.writeBetLog({ msg: 'bet timeout', data: this.toSimpleLogData(odds) });
        console.warn('betTimeout', odds);
        //cancel bet
        this.onOddsOnBetUpdated(bookmaker, null);
    }

    onBetPostError = (num: number) => {
        const { dispatch } = this.props;
        dispatch(auth.logout('Network broken'));
    }
    onTabChanged = (event: React.ChangeEvent<{}>, value: number) => {
        this.setState({ selectedTab: value });
    }

    toggleDevTools = () => {
        this.setState({ devToolOpen: !this.state.devToolOpen });
    }

    onBetslipIPC = async (sender: BookieWebView, msg: WebviewIPCMsg) => {
    }

    goToNextBet = (bookmaker: string, bet: KOBet, error?: string) => {
        console.log('gotoNextBet', bookmaker);
        this.oodsOnBetting.set(bookmaker, null);

        this.betSlip.nextBet(bookmaker, bet, error);
    }

    onBookmakerUpdated = (makers: KOBookmaker[]) => {
        console.warn('onBookmakerUpdated', makers);
        this.setState({ bookmakers: makers });
    }

    writeBetLog(log: KOBetLog) {
        const { dispatch } = this.props;
        dispatch(betslipAction.writeBetLog(log));
    }

    onBetslipLoginStatusUpdated = (bookmaker: string, username: string, logged: boolean, error?: string) => {

        const { dispatch } = this.props;
        dispatch(betslipAction.updateAccountLoginStatus(bookmaker, username, logged, error));
        this.writeBetLog({ msg: `login ${bookmaker}-${username}:${logged}`, data: error })
        this.betSlip.setBookmakerBetEnable(bookmaker, logged);
    }
    onBetslipBetResult = (bookmaker: string, result: { error?: string, bet: KOBet }) => {
        console.warn('onBetslipBetResult', bookmaker, result);
        if (!result.error) {
            this.writeBetLog({ msg: `${bookmaker}:bet place success`, data: this.toSimpleLogData(result.bet) });
        }
        else {
            this.writeBetLog({ msg: `${bookmaker}:bet place error ${result.error}`, data: this.toSimpleLogData(result.bet) });
            if (result.error === 'SessionTimeout') {
                return;
            }
        }
        this.goToNextBet(bookmaker, result.bet, result.error);
    }
    onBetslipBalanceUpdated = (bookmaker: string, balance: string) => {
        const { dispatch } = this.props;
        console.log('onbalance update', balance);
        dispatch(betslipAction.updateBalance(bookmaker, balance));
    }

    onListBetHistory = async (criteria: PlacedBetSearchCriteria) => {

        const result = await this.betSlip.listBetHistory(criteria);
        return result;
    }
    onDisplayOddsFromServer = (koOddsList: KOOdds[]) => {
        this.setState({ displayValueOddsList: koOddsList || [] });
    }
    onValueOddsFromServer = (oddsList: KOOdds[]) => {
        this.setState({ valueOddsList: oddsList || [] });
    }

    toSimpleLogData = (betOrOdds: KOBet | KOOdds) => {
        if (!betOrOdds) return undefined;
        if ((betOrOdds as KOBet).placedStake) {
            const bet = betOrOdds as KOBet;
            return {
                evt: bet.euuid, mkt: bet.marketType, hd: bet.handicap,
                sna: bet.selectionName, sid: bet.selectionId,
                odds: bet.odds, podds: bet.placedOdds,
                stake: bet.placedStake, ref: bet.placedReference, btime: bet.betTime
            };
        }
        else {
            const bet = betOrOdds as KOOdds;
            return {
                evt: bet.euuid, mkt: bet.marketType, hd: bet.handicap,
                sna: bet.selectionName, sid: bet.selectionId, odds: bet.odds
            };
        }
    }
    onBetslipBrowserError = (bookmaker: BookmakerCredential, reason: string) => {
        if (reason === 'ProxyLoginTooMuchAttempts') {
            this.setState({ alert: `${bookmaker.name} proxy login attempts failure, please check your proxy account` });
        }
    }


    render() {

        const appSettings = Settings.getAppSettings();
        const { valueOddsList, displayValueOddsList } = this.state;

        const featureTabs = ['Bet Overview'];
        if (appSettings['betplayer.oddsPanel']) {
            featureTabs.push(...['Value Odds', 'Value Odds (Display Only)']);
        }

        const { selectedTab, bookmakers, devToolOpen } = this.state;
        return (
            <div className={css(styles.container)}>
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    {appSettings['common.debug'] && (<React.Fragment>
                        <Button size="small" color="inherit" onClick={this.toggleDevTools}>
                            {devToolOpen ? 'Close Debug Console' : 'Open Debug Console'}
                        </Button>
                    </React.Fragment>)
                    }
                </div>
                <Tabs classes={{ root: css(styles.tabsRoot) }}
                    value={selectedTab}
                    variant='scrollable'
                    scrollButtons="auto"
                    onChange={this.onTabChanged}>
                    {featureTabs.map(tab => {
                        return (
                            <Tab style={{ color: 'red' }}
                                classes={{
                                    root: css(styles.tabRoot),
                                    label: css(styles.tabLabel)
                                }} label={tab} key={tab} />
                        );
                    })}
                    {
                        bookmakers.map(w => {
                            const proxyCountry = Settings.getProxyCountry(w.name);
                            return (<Tab classes={{
                                root: css(styles.tabRoot),
                                label: css(styles.tabLabel)
                            }}
                                key={w.name}
                                label={
                                    <div style={{ flexDirection: 'row', alignItems: 'center', display: 'flex' }}>
                                        <div>{!!proxyCountry ? `${w.name} (${proxyCountry})` : `${w.name}`}</div>
                                        {!!proxyCountry && <CircleIndicator color="green" size={10} />}
                                    </div>
                                }
                            />)
                        })
                    }
                </Tabs>
                <div style={{ flex: 1, position: 'relative' }}>
                    {
                        <React.Fragment>
                            {
                                featureTabs.map((tab, index) => {
                                    return (<div key={tab}
                                        // web view issue conflic with aphrodite (no render at first load)
                                        //refer to https://github.com/electron/electron/issues/8505
                                        style={{
                                            position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                                            zIndex: selectedTab === index ? (bookmakers.length + featureTabs.length + 1) : 0,
                                        }}>
                                        {tab === 'Bet Overview' && <BetOverview
                                            onListBetHistory={this.onListBetHistory} />}
                                        {tab === 'Value Odds' && <OddsBoard valueOddsList={valueOddsList} usage='bet' />}
                                        {tab === 'Value Odds (Display Only)' && <OddsBoard valueOddsList={displayValueOddsList} usage='display' />}
                                    </div>)
                                })
                            }

                            {
                                bookmakers.map((w, index) => {
                                    const oddsOnBet = this.state.valueOddsForBet.find(i => i.bookmaker === w.name);
                                    return (<div key={w.name}
                                        className={css(appStyles.absolute)}
                                        style={{
                                            zIndex: selectedTab === (index + featureTabs.length) ? (bookmakers.length + featureTabs.length) : index
                                        }}>
                                        {(() => {
                                            const props: BetslipBrowserProps = {
                                                onWebviewIPC: this.onBetslipIPC,
                                                onLoginStatusUpdated: this.onBetslipLoginStatusUpdated,
                                                onBalanceUpdated: this.onBetslipBalanceUpdated,
                                                onBetResult: this.onBetslipBetResult,
                                                betEnable: w.betable,
                                                bookmaker: w.credential,
                                                oddsOnBet: !!oddsOnBet ? oddsOnBet.valueOdds : null,
                                                devToolOpen: (selectedTab === (index + 1) || (selectedTab === 0 && index === 1)) && devToolOpen,
                                                onError: this.onBetslipBrowserError

                                            };
                                            switch (w.name) {
												case 'bwin':
													return (<BwinBrowser {...props} key={w.name} />)
                                                default:
                                                    return null;
                                            }
                                        })()
                                        }
                                    </div>)
                                })
                            }
                        </React.Fragment>
                    }
                </div>
                {
                    !!this.state.alert &&
                    <AlertDialog message={this.state.alert} onClosed={() => this.setState({ alert: undefined })} />
                }
            </div>
        )
    }
}

export default connect()(BetslipContainer);


const styles = StyleSheet.create({
    container:
    {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: '#fff',
        display: 'flex'
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
    }

});