import React from 'react';
import Paper from '@material-ui/core/Paper';
import InputLabel from '@material-ui/core/InputLabel';
import { css, StyleSheet } from 'aphrodite/no-important';
import moment from 'moment';
import { util, Common, Settings } from '../../services';
import { KOServerBet, PlacedBetSearchCriteria, PlacedBetSearchResult } from '../../models';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MuiPickersUtilsProvider from 'material-ui-pickers/MuiPickersUtilsProvider';
import DatePicker from 'material-ui-pickers/DatePicker';
import MomentUtils from '@date-io/moment';
import CircularProgress from '@material-ui/core/CircularProgress';
import Fab from '@material-ui/core/Fab';
import Autorenew from '@material-ui/icons/Autorenew';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';
import { BetTable } from './BetTable';

export interface Props {
    onRefreshBets: (criteria: PlacedBetSearchCriteria) => Promise<PlacedBetSearchResult | null>,
}
interface States {
    selectedSports: Array<string>;
    selectedBookmakers: Array<string>;
    bookmakers: Array<string>;
    sports: Array<string>;
    pageSize: number;
    page: number;
    selectedDatePickerFrom: Date;
    selectedDatePickerTo: Date;
    loading: boolean;
    betResult: PlacedBetSearchResult

}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 10 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};


export default class ProfitLoss extends React.PureComponent<Props, States>{
    syncTimerId?: number;
    mounted: boolean = true;
    state: States = {
        selectedSports: ['ALL'],
        selectedBookmakers: ['ALL'],
        sports: ['ALL'],
        bookmakers: ['ALL'],
        pageSize: 25,
        page: 0,
        selectedDatePickerFrom: new Date(),
        selectedDatePickerTo: new Date(),
        loading: false,
        betResult: {
            bets: [],
            summary: { totalBets: 0, pendingBets: 0, lostBets: 0, wonBets: 0, pl: 0, rollover: 0, refundBets: 0 },
            info: { sports: [], bookmakers: [], users: [] }
        }

    };


    componentDidMount() {
        this.mounted = true;
        window.clearInterval(this.syncTimerId);
        this.syncTimerId = window.setInterval(this.onRefreshBets, 1000 * 60 * 15);
        this.onRefreshBets();
    }
    componentWillUnmount() {
        window.clearInterval(this.syncTimerId);
        this.mounted = false;
    }
    componentDidUpdate(prevProps: Props, prevState: States, snapshot: any) {
        if (this.state.betResult !== prevState.betResult) {
            this.updateOptionsOnBets(this.state.betResult);
        }
        if (prevState.page !== this.state.page) {
            this.onRefreshBets();
        }
        else if (prevState.pageSize !== this.state.pageSize) {
            this.onRefreshBets();
        }

    }

    handleChange = (path: string) => (event: any) => {
        const { selectedSports, selectedBookmakers } = this.state;

        let newSelectedItems = event.target.value as string[];

        if (path === 'sports') {
            if (newSelectedItems.indexOf('ALL') >= 0 && selectedSports.indexOf('ALL') === -1) {
                newSelectedItems = ['ALL'];
            }
            else if (newSelectedItems.indexOf('ALL') >= 0) {
                newSelectedItems.splice(newSelectedItems.indexOf('ALL'), 1);
            }
            else if (newSelectedItems.length === 0) {
                newSelectedItems = ['ALL'];
            }

            this.setState({ selectedSports: newSelectedItems });
        }
        else if (path === 'bookmakers') {
            if (newSelectedItems.indexOf('ALL') >= 0 && selectedBookmakers.indexOf('ALL') === -1) {
                newSelectedItems = ['ALL'];
            }
            else if (newSelectedItems.indexOf('ALL') >= 0) {
                newSelectedItems.splice(newSelectedItems.indexOf('ALL'), 1);
            }
            else if (newSelectedItems.length === 0) {
                newSelectedItems = ['ALL'];
            }

            this.setState({ selectedBookmakers: newSelectedItems });
        }

    };

    updateOptionsOnBets = (betResult: PlacedBetSearchResult | null) => {
        if (!betResult) return;
        let users: Array<string> = [];
        let sports: Array<string> = [];
        let bookmakers: Array<string> = [];

        if (!betResult.info) return;
        const { users: ausers, sports: asports, bookmakers: abookmakers } = betResult.info;

        users = [...new Set(ausers)];
        users.unshift('ALL');

        sports = [...new Set(asports)];
        sports.unshift('ALL');

        bookmakers = [...new Set(abookmakers)];
        bookmakers.unshift('ALL');
        this.setState({
            sports: sports,
            bookmakers: bookmakers,
        })
    };

    handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, page: number) => {
        if (this.state.loading) return;
        this.setState({ page });

    };
    handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (this.state.loading) return;
        this.setState({ pageSize: +event.target.value });

    };

    isCrossBet = (bet: KOServerBet) => {
        return Common.isCrossBet(bet);
    };

    handleDateChange = (path: string) => (date: Date) => {

        const { selectedDatePickerTo, selectedDatePickerFrom } = this.state;
        if (path === "selectedDatePickerFrom") {
            this.setState({ selectedDatePickerFrom: date });
            if (moment(selectedDatePickerTo).diff(date, 'days') > 32) {
                this.setState({ selectedDatePickerTo: moment(date).add(32, 'days').toDate() });
            }
        } else if (path === "selectedDatePickerTo") {
            this.setState({ selectedDatePickerTo: date });
            if (moment(selectedDatePickerTo).diff(selectedDatePickerFrom, 'days') > 32) {
                this.setState({ selectedDatePickerFrom: moment(date).add(-32, 'days').toDate() });
            }
        }

    };

    onTablePage = (page: number, pageSize: number) => {
        this.setState({ page, pageSize });
    }
    onRefreshBets = async () => {
        try {
            this.setState({ loading: true });
            const { selectedDatePickerFrom, selectedDatePickerTo,
                selectedBookmakers, selectedSports, pageSize, page } = this.state;
            const start = +moment(+selectedDatePickerFrom).utc().startOf('days');
            const end = +moment(+selectedDatePickerTo).utc().endOf('days');

            let result = await (this.props.onRefreshBets({
                from: start, to: end,
                page: page, pagesize: pageSize,
                summary_only: !Settings.getAppSettings()['betplayer.oddsPanel'],
                bookmakers: selectedBookmakers.includes('ALL') ? '' : selectedBookmakers.join(','),
                sports: selectedSports.includes('ALL') ? '' : selectedSports.join(',')
            }));
            if (!result) {
                result = {
                    bets: [],
                    summary: { totalBets: 0, pendingBets: 0, lostBets: 0, wonBets: 0, pl: 0, rollover: 0, refundBets: 0 },
                    info: { sports: [], bookmakers: [], users: [] }
                }
            }
            if (!this.mounted) return;
            this.setState({ loading: false, betResult: result });

        } catch (error) {
            console.error(error);
            this.setState({ loading: false });
        }

    };


    render() {
        const { loading, page, pageSize,
            selectedSports, sports, bookmakers, selectedBookmakers,
            selectedDatePickerFrom, selectedDatePickerTo } = this.state;

        const { betResult } = this.state;


        const resultSummary = betResult.summary;
        const resultBets = betResult.bets;

        const labelFontSize = '0.85rem';
        return (
            <Paper className={css(styles.container)}>
                <div style={{ paddingTop: 10, display: 'flex', alignItems: 'center' }}>

                    <FormControl className={css(styles.formControl, styles.userSelect)}>
                        <InputLabel htmlFor="select-multiple-chip" style={{ fontSize: labelFontSize }}>Bookmakers</InputLabel>
                        <Select
                            multiple
                            style={{ fontSize: labelFontSize }}
                            value={selectedBookmakers}
                            onChange={this.handleChange('bookmakers')}
                            renderValue={(selected: any) => selected.join(', ')}
                            MenuProps={MenuProps}
                        >
                            {bookmakers.map((maker: string) => (
                                <MenuItem key={maker} value={maker}>
                                    <Checkbox checked={selectedBookmakers.indexOf(maker) > -1} />
                                    <ListItemText primary={maker} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl className={css(styles.formControl, styles.userSelect)}>
                        <InputLabel htmlFor="select-multiple-chip" style={{ fontSize: labelFontSize }}>Sports</InputLabel>
                        <Select
                            multiple
                            style={{ fontSize: labelFontSize }}
                            value={selectedSports}
                            onChange={this.handleChange('sports')}
                            renderValue={(selected: any) => selected.join(', ')}
                            MenuProps={MenuProps}
                        >
                            {sports.map((sport: string) => (
                                <MenuItem key={sport} value={sport}>
                                    <Checkbox checked={selectedSports.indexOf(sport) > -1} />
                                    <ListItemText primary={sport} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl className={css(styles.formDateControl, styles.userSelect)}>
                        <MuiPickersUtilsProvider utils={MomentUtils}>
                            <DatePicker
                                disableFuture
                                autoOk
                                value={selectedDatePickerFrom}
                                maxDate={selectedDatePickerTo}
                                label={'From (GMT+0)'}
                                style={{ fontSize: labelFontSize }}
                                onChange={this.handleDateChange('selectedDatePickerFrom')} />
                        </MuiPickersUtilsProvider>
                    </FormControl>
                    <FormControl className={css(styles.formDateControl, styles.userSelect)}>
                        <MuiPickersUtilsProvider utils={MomentUtils}>
                            <DatePicker
                                disableFuture
                                autoOk
                                value={selectedDatePickerTo}
                                label={'To (GMT+0)'}
                                minDate={selectedDatePickerFrom}
                                style={{ fontSize: labelFontSize }}
                                onChange={this.handleDateChange('selectedDatePickerTo')} />
                        </MuiPickersUtilsProvider>
                    </FormControl>

                    {!loading ?
                        <Fab size="small" onClick={this.onRefreshBets} className={css(styles.refreshButton)} color="primary" aria-label="Delete" >
                            <Autorenew />
                        </Fab> :
                        <CircularProgress className={css(styles.refreshButton)} disableShrink size={40} />
                    }
                    <p style={{ paddingLeft: 15, }}>refresh every 15 minutes automatically, if want to see the result immediately, click refresh button</p>

                </div>
                {!!resultSummary && <div className={css(styles.plinfoCont)}>
                    <p>
                        <span style={{ backgroundColor: (+resultSummary.pl) > 0 ? 'rgba(100,255,100,0.5)' : 'rgba(255,100,100,0.5)' }}>
                            PL: {Math.round(resultSummary.pl)}&nbsp;
                            Rollover: {Math.round(resultSummary.rollover)}&nbsp;
                            Roi: {util.toPrintableNumber(util.financial(resultSummary.pl / resultSummary.rollover * 100))}%&nbsp;
                            Pending Bets: {resultSummary.pendingBets}&nbsp;
                            Won Bets: {resultSummary.wonBets}&nbsp;
                            Lost Bets: {resultSummary.lostBets}&nbsp;
                        </span>
                    </p>
                </div>}
                {!!Settings.getAppSettings()['betplayer.oddsPanel'] && <BetTable loading={loading} displayBets={resultBets}
                    totals={resultSummary.totalBets} page={page} pageSize={pageSize} onPage={this.onTablePage} />
                }
            </Paper>
        );
    }
}

const styles = StyleSheet.create({
    container:
    {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        overflow: 'auto'
    },
    refreshButton: {
        marginLeft: 15
    },


    userSelect: {
        marginLeft: 15
    },
    plinfoCont: {
        marginLeft: 15,
        fontSize: '0.75rem'
    },

    formControl: {
        minWidth: 160,
        maxWidth: 160,
    },
    formDateControl: {
        minWidth: 120,
        maxWidth: 120
    },

});

