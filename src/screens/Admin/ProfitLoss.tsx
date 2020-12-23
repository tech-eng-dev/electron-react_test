import React from 'react';
import Paper from '@material-ui/core/Paper';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import InputLabel from '@material-ui/core/InputLabel';
import { css, StyleSheet } from 'aphrodite/no-important';
import moment from 'moment';
import { Common } from '../../services';
import { KOServerBet, BetProfitCriteria, BetProfitSearchResult, UserProfit, ProfitSummary } from '../../models';
import FormControl from '@material-ui/core/FormControl';
import MuiPickersUtilsProvider from 'material-ui-pickers/MuiPickersUtilsProvider';
import DatePicker from 'material-ui-pickers/DatePicker';
import MomentUtils from '@date-io/moment';
import CircularProgress from '@material-ui/core/CircularProgress';
import Fab from '@material-ui/core/Fab';
import Autorenew from '@material-ui/icons/Autorenew';
import Input from '@material-ui/core/Input';
import { BetTable } from './BetTable';
import ProfitLostDetails from './ProfitLostDetails';
import ProfitSummaryLine from './ProfitSummaryLine';
import MultipleDrownList from '../../components/MultipleDrownList';

export interface Props {
    onRefreshBets: (criteria: BetProfitCriteria) => Promise<BetProfitSearchResult | null>,
}
interface States {
    selectedUsers: Array<string>;
    selectedSports: Array<string>;
    selectedBookmakers: Array<string>;
    selectedTags: Array<string>;
    searchByEvent: string;
    searchByMarket: string;
    bookmakers: Array<string>;
    users: Array<string>;
    tags: Array<string>;
    sports: Array<string>;
    rowsPerPage: number;
    page: number;
    selectedDatePickerFrom: Date;
    selectedDatePickerTo: Date;
    loading: boolean;
    betResult: BetProfitSearchResult;
    selectedTab: number;
    searchByIp: string;

}

class ProfitLoss extends React.PureComponent<Props, States>{
    state: States = {
        betResult: {
            bets: [],
            profits: [],
            info: { sports: [], bookmakers: [], users: [], tags: [] }
        },

        selectedUsers: ['ALL'],
        selectedSports: ['ALL'],
        selectedBookmakers: ['ALL'],
        selectedTags: ['ALL'],
        users: ['ALL'],
        tags: ['ALL'],
        sports: ['ALL'],
        bookmakers: ['ALL'],
        rowsPerPage: 25,
        page: 0,
        selectedDatePickerFrom: new Date(),
        selectedDatePickerTo: new Date(),
        loading: false,
        searchByEvent: '',
        searchByMarket: '',
        searchByIp: '',
        selectedTab: 0,
    };


    componentDidMount() {
        this.refreshBets();
    }
    componentDidUpdate(prevProps: Props, prevState: States, snapshot: any) {
        if (this.state.betResult !== prevState.betResult) {
            this.updateOptionsOnBets(this.state.betResult);
        }
        if (prevState.page !== this.state.page) {
            this.refreshBets();
        }
        else if (prevState.rowsPerPage !== this.state.rowsPerPage) {
            this.refreshBets();
        }

    }

    handleSelectChange = (path: string) => (newSelectedItems: string[]) => {
        const { selectedSports, selectedUsers, selectedBookmakers, selectedTags } = this.state;


        if (path === 'users') {
            if (newSelectedItems.indexOf('ALL') >= 0 && selectedUsers.indexOf('ALL') === -1) {
                newSelectedItems = ['ALL'];
            }
            else if (newSelectedItems.indexOf('ALL') >= 0) {
                newSelectedItems.splice(newSelectedItems.indexOf('ALL'), 1);
            }
            else if (newSelectedItems.length === 0) {
                newSelectedItems = ['ALL'];
            }
            this.setState({ selectedUsers: newSelectedItems });
        }
        else if (path === 'sports') {
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
        else if (path === 'tags') {
            if (newSelectedItems.indexOf('ALL') >= 0 && selectedTags.indexOf('ALL') === -1) {
                newSelectedItems = ['ALL'];
            }
            else if (newSelectedItems.indexOf('ALL') >= 0) {
                newSelectedItems.splice(newSelectedItems.indexOf('ALL'), 1);
            }
            else if (newSelectedItems.length === 0) {
                newSelectedItems = ['ALL'];
            }

            this.setState({ selectedTags: newSelectedItems });
        }
    }

    handleInputChange = (path: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        if (path === 'searchByEvent') {
            this.setState({ searchByEvent: event.target.value });
        }
        else if (path === 'searchByMarket') {
            this.setState({ searchByMarket: event.target.value });
        }
        else if (path === 'searchByIp') {
            this.setState({ searchByIp: event.target.value });
        }
    }

    updateOptionsOnBets = (betResult: BetProfitSearchResult | null) => {
        if (!betResult) return;
        let users: Array<string> = [];
        let sports: Array<string> = [];
        let bookmakers: Array<string> = [];
        let tags: Array<string> = [];

        if (!betResult.info) return;
        const { users: ausers, sports: asports, bookmakers: abookmakers, tags: atags } = betResult.info;

        users = [...new Set(ausers)].sort((a, b) => a.localeCompare(b));
        users.unshift('ALL');

        sports = [...new Set(asports)];
        sports.unshift('ALL');

        bookmakers = [...new Set(abookmakers)];
        bookmakers.unshift('ALL');

        tags = [...new Set(atags)].sort((a, b) => a.localeCompare(b));
        tags.unshift('ALL');

        this.setState({
            users: users,
            sports: sports,
            bookmakers: bookmakers,
            tags: tags
        })
    };

    onPage = (page: number, pageSize: number) => {
        if (this.state.loading) return;
        this.setState({ page, rowsPerPage: pageSize });

    };


    isCrossBet = (bet: KOServerBet) => {
        return Common.isCrossBet(bet);
    };

    handleDateChange = (path: string) => (date: Date) => {

        if (path === "selectedDatePickerFrom") {
            this.setState({ selectedDatePickerFrom: date });
        } else if (path === "selectedDatePickerTo") {
            this.setState({ selectedDatePickerTo: date });
        }

    };

    onTabChanged = (event: any, value: number) => {
        this.setState({ selectedTab: value });
    }

    refreshBets = async () => {
        try {
            this.setState({ loading: true });
            const { selectedDatePickerFrom, selectedDatePickerTo, searchByEvent, searchByMarket, selectedTags,
                selectedBookmakers, selectedSports, selectedUsers, page, rowsPerPage, searchByIp } = this.state;

            const start = +moment(+selectedDatePickerFrom).utc().startOf('days');
            const end = +moment(+selectedDatePickerTo).utc().endOf('days');

            let betProfits = await (this.props.onRefreshBets({
                from: start, to: end,
                page: page, pagesize: rowsPerPage,
                markets: searchByMarket,
                events: searchByEvent,
                ips: searchByIp,
                bookmakers: selectedBookmakers.includes('ALL') ? '' : selectedBookmakers.join(','),
                sports: selectedSports.includes('ALL') ? '' : selectedSports.join(','),
                usernames: selectedUsers.includes('ALL') ? '' : selectedUsers.join(','),
                tags: selectedTags.includes('ALL') ? '' : selectedTags.join(',')
            }));

            if (!betProfits) {
                betProfits = {
                    bets: [],
                    profits: [],
                    info: { sports: [], bookmakers: [], users: [], tags: [] }
                };

            }
            this.setState({ loading: false, betResult: betProfits });

        } catch (error) {
            console.error(error);
            this.setState({ loading: false });
        }

    };

    getBetTotalSummary = (profits: UserProfit[]) => {
        const summary: ProfitSummary = { pl: 0, rollover: 0, totalBets: 0, lostBets: 0, pendingBets: 0, wonBets: 0 };
        for (const curProfit of profits) {
            summary.pl += (+curProfit.pl);
            summary.rollover += (+curProfit.rollover);
            summary.totalBets += (+curProfit.totalBets);
            summary.pendingBets += (+curProfit.pendingBets);
            summary.lostBets += (+curProfit.lostBets);
            summary.wonBets += (+curProfit.wonBets);
        }
        return summary;
    }

    render() {
        const { selectedUsers, loading, users, page, rowsPerPage,
            selectedSports, sports, bookmakers, selectedBookmakers,
            selectedDatePickerFrom, selectedDatePickerTo, tags,
            searchByEvent, searchByMarket, searchByIp, betResult, selectedTags, selectedTab } = this.state;

        const resultSummary = this.getBetTotalSummary(betResult.profits);
        const resultBets = betResult.bets;

        const labelFontSize = '0.85rem';
        return (
            <Paper className={css(styles.container)}>
                <div style={{ paddingTop: 10, display: 'flex', alignItems: 'center' }}>
                    <MultipleDrownList label="Teams" onSelected={this.handleSelectChange('tags')}
                        items={tags} selectedItems={selectedTags} />

                    <MultipleDrownList label="Users" onSelected={this.handleSelectChange('users')}
                        items={users} selectedItems={selectedUsers} />

                    <MultipleDrownList label="Bookmakers" onSelected={this.handleSelectChange('bookmakers')}
                        items={bookmakers} selectedItems={selectedBookmakers} />

                    <MultipleDrownList label="Sports" onSelected={this.handleSelectChange('sports')}
                        items={sports} selectedItems={selectedSports} />



                    <FormControl className={css(styles.formControl, styles.userSelect)}>
                        <InputLabel style={{ fontSize: labelFontSize }} htmlFor="select-multiple-chip">{'Ips (Seperated By ,)'}</InputLabel>
                        <Input
                            onChange={this.handleInputChange('searchByIp')}
                            value={searchByIp}
                        />
                    </FormControl>

                    <FormControl className={css(styles.formControl, styles.userSelect)}>
                        <InputLabel style={{ fontSize: labelFontSize }} htmlFor="select-multiple-chip">{'Event (Seperated By ,)'}</InputLabel>
                        <Input style={{ fontSize: labelFontSize }}
                            onChange={this.handleInputChange('searchByEvent')}
                            value={searchByEvent}
                        />
                    </FormControl>
                    <FormControl className={css(styles.formControl, styles.userSelect)}>
                        <InputLabel style={{ fontSize: labelFontSize }} htmlFor="select-multiple-chip">{'Market (Seperated By ,)'}</InputLabel>
                        <Input
                            onChange={this.handleInputChange('searchByMarket')}
                            value={searchByMarket}
                        />
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
                        <Fab size="small" onClick={this.refreshBets} className={css(styles.refreshButton)} color="primary" aria-label="Delete" >
                            <Autorenew />
                        </Fab> :
                        <CircularProgress className={css(styles.refreshButton)} disableShrink size={40} />
                    }

                </div>
                < Tabs classes={{ root: css(styles.tabsRoot) }}
                    value={selectedTab}
                    onChange={this.onTabChanged}>
                    {['Summary', 'Details']
                        .map((name, index) => {
                            return (<Tab key={name}
                                classes={{ root: css(styles.tabRoot), label: css(styles.tabLabel) }}
                                label={name} />);
                        })}/>
                </Tabs>
                {selectedTab === 0 && (<div className={css(styles.tagContainer)}>
                    {!!resultSummary && <ProfitSummaryLine summary={resultSummary} />}

                    <BetTable displayBets={resultBets} page={page}
                        totals={resultSummary.totalBets}
                        pageSize={rowsPerPage}
                        onPage={this.onPage} loading={loading} />

                </div>)}

                {selectedTab === 1 && (<div className={css(styles.tagContainer)}>

                    <ProfitLostDetails userProfits={betResult.profits} />

                </div>)}

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
    tagContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff'
    },
    refreshButton: {
        marginLeft: 15
    },

    userSelect: {
        marginLeft: 15
    },

    formControl: {
        minWidth: 160,
        maxWidth: 160,
    },
    formDateControl: {
        minWidth: 120,
        maxWidth: 120
    },
    tabPos:
    {

    },
    tabsRoot:
    {
        minHeight: 30,
        marginTop: 8,
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

export default ProfitLoss;

