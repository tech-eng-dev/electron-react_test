import React, { Component, PureComponent } from 'react';
import TextField from '@material-ui/core/TextField';

import { StyleSheet, css } from 'aphrodite';
import moment from 'moment';
import { util, Common } from '../../services';
import { KOServerBet } from '../../models';
import CircularProgress from '@material-ui/core/CircularProgress';
import Fab from '@material-ui/core/Fab';
import Autorenew from '@material-ui/icons/Autorenew';
import memoizeOne from 'memoize-one';
import { BetTable } from './BetTable';


export interface Props {
    placedBets: KOServerBet[];
    onRefreshBet: (from: number, to: number) => Promise<void>
}

interface States {
    page: number;
    pageSize: number;
    searchByEvent: string;
    searchByMarket: string;
    loading: boolean;
}

export default class TodayBets extends PureComponent<Props, States> {
    private syncTimerId?: number;
    state: States = {
        loading: false,
        page: 0,
        pageSize: 25,
        searchByEvent: '',
        searchByMarket: ''
    };

    constructor(props: Props) {
        super(props);

    }

    componentDidMount() {
        window.clearInterval(this.syncTimerId);
        console.warn('comond di mount');
        this.syncTimerId = window.setInterval(this.refreshBets, 1000 * 60 * 30);
        this.refreshBets();

    }
    refreshBets = async () => {
        try {
            this.setState({ loading: true });

            const startTime = +moment().startOf('days');
            const endTime = +moment().endOf('days');
            await this.props.onRefreshBet(startTime, endTime);
            this.setState({ loading: false });
        } catch (error) {
            console.error(error);
            this.setState({ loading: false });
        }
    }
    componentWillUnmount() {
        window.clearInterval(this.syncTimerId);
    }

    isCrossBet = (bet: KOServerBet) => {
        return Common.isCrossBet(bet);
    }

    onBetTablePage = (page: number, pageSize: number) => {
        this.setState({ page, pageSize });
    }
    onBetFilterChange = (filterName: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {

        if (filterName === 'events') {
            this.setState({ searchByEvent: event.target.value });
        }
        else if (filterName === 'markets') {
            this.setState({ searchByMarket: event.target.value });
        }
    }

    getDisplayBets = (placedBets: KOServerBet[], searchEvents: string, searchMarkets: string) => {
        const eventList = (searchEvents || '').toLowerCase().split(',');
        const marketList = (searchMarkets || '').toLowerCase().split(',');
        //hurge array, if call filter/foreach... ect es6 functions, 
        // it will cause max call stack size
        const filterBets: KOServerBet[] = [];
        for (const bet of placedBets) {
            if (eventList.some(z => bet.eventName.toLowerCase().includes(z))
                && marketList.some(k => bet.marketType.toLowerCase().startsWith(k))
            ) {
                filterBets.push(bet);
            }
        }
        return filterBets;
    }
    getBetsSummary = (bets: KOServerBet[]) => {
        return Common.getBetSummary(bets);
    };
    memozieOnGetBetSummary = memoizeOne(this.getBetsSummary);
    momozieOnGetDisplayBets = memoizeOne(this.getDisplayBets);
    render() {
        const { placedBets } = this.props;
        const { loading, searchByEvent, searchByMarket, page, pageSize } = this.state;

        const displayBets = this.momozieOnGetDisplayBets(placedBets || [], searchByEvent, searchByMarket);
        const pageBets = displayBets.slice(page * pageSize, (page + 1) * pageSize);
        const betSummary = this.memozieOnGetBetSummary(displayBets);

        return (

            <div>
                <div style={{ display: 'flex', flexDirection: "row", justifyContent: 'space-between', paddingLeft: 15, padding: 10, alignItems: 'center' }}>
                    <div className={css(styles.formCont)}>

                        <TextField
                            label="events (seperated by ',')"
                            value={this.state.searchByEvent}
                            onChange={this.onBetFilterChange('events')}
                            margin="none"
                            style={{ marginRight: 15, width: 240 }}
                        />

                        <TextField
                            label="markets (seperated by ',')"
                            value={this.state.searchByMarket}
                            onChange={this.onBetFilterChange('markets')}
                            margin="none"
                            style={{ marginRight: 15, width: 240 }}
                        />

                        {!loading ?
                            <Fab size="small" onClick={this.refreshBets} color="primary" aria-label="Delete" >
                                <Autorenew />
                            </Fab> :
                            <CircularProgress disableShrink />
                        }
                    </div>
                </div>
                {!!betSummary && <div style={{ paddingLeft: 15 }}>
                    <p>
                        <span style={{ backgroundColor: (+betSummary.totalPL) > 0 ? 'rgba(100,255,100,0.5)' : 'rgba(255,100,100,0.5)' }}>
                            PL: {betSummary.totalPL}&nbsp;
                            Rollover: {betSummary.totalRollover}&nbsp;
                            Roi: {util.toPrintableNumber(betSummary.totalRoi)}%&nbsp;
                            Pending Bets: {betSummary.pendingBets}&nbsp;
                            Won Bets: {betSummary.won}&nbsp;
                            Lost Bets: {betSummary.lost}&nbsp;
                        </span>
                    </p>
                </div>
                }
                <BetTable displayBets={pageBets} totals={displayBets.length}
                    page={page} pageSize={pageSize} loading={loading}
                    onPage={this.onBetTablePage} />
            </div>
        )
    }
}

const styles = StyleSheet.create({
    formCont: {
        display: 'flex',
        alignItem: 'center',
    }
});