import React, { PureComponent } from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TablePagination from '@material-ui/core/TablePagination';
import { StyleSheet, css } from 'aphrodite';
import moment from 'moment';
import { util, Common } from '../../services';
import { KOServerBet } from '../../models';



export interface Props {
    displayBets: KOServerBet[],
    totals: number;
    page: number;
    pageSize: number;
    onPage: (page: number, pageSize: number) => void,
    loading: boolean
}

interface States {
}


const ColumnNames = [
    { id: 'result', algin: 'left', width: 40, label: 'Result' },
    { id: 'betTime', algin: 'left', width: 80, label: 'Bet Time' },
    { id: 'username', algin: 'left', width: 120, label: 'Username' },
    { id: 'bookmaker', algin: 'left', width: 120, label: 'Bookmaker' },
    { id: 'Sport', algin: 'left', width: 80, label: 'Sport' },
    { id: 'eventName', algin: 'left', width: 220, label: 'Event Name' },
    { id: 'marketType', algin: 'left', width: 160, label: 'Market Type' },
    { id: 'selectionName', algin: 'left', width: 160, label: 'Selection Name' },
    { id: 'placedOdds', algin: 'left', width: 140, label: 'Placed / Extract / Base Odds' },
    { id: 'placedStake', algin: 'left', width: 80, label: 'Stake Amount' },
    { id: 'valueX', algin: 'left', width: 60, label: 'valueX' },
    { id: 'crosscheck', algin: 'left', width: 60, label: 'Cross Bet' },
    { id: 'profit', algin: 'left', width: 80, label: 'Profit' },
];


export class BetTable extends PureComponent<Props, States> {
    state: States = {
        rowsPerPage: 25,
        page: 0,
    };

    componentDidMount() {

    }
    componentDidUpdate(prevProps: Props, prevState: States) {
        // if (this.props.page !== prevProps.page) {
        //     this.props.onPage(this.props.page, this.props.pageSize);
        // }
        // else if (this.props.pageSize !== prevProps.pageSize) {
        //     this.props.onPage(this.props.page, this.props.pageSize);
        // }
    }
    componentWillUnmount() {
    }

    handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, page: number) => {
        if (this.props.loading) return;
        this.props.onPage(page, this.props.pageSize);

    };

    handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (this.props.loading) return;
        this.props.onPage(this.props.page, +event.target.value);

    };

    isCrossBet = (bet: KOServerBet) => {
        return Common.isCrossBet(bet);
    }

    betItemToDisplay = (bet: KOServerBet) => {
        const profit = Common.getBetProfit(bet);
        let valueX = 0;
        if (bet.placedOdds) {
            if (this.isCrossBet(bet)) {
                valueX = util.financial((1 - (1 / bet.placedOdds + 1 / bet.baseOdds)) * 100);
            }
            else {
                valueX = util.financial((bet.placedOdds - bet.baseOdds) / bet.baseOdds * 100);
            }
        }


        let resultColor = 'rgba(255, 238, 40, 1)';
        let resultStr = 'Unknown';
        if (bet.won === 1) {
            resultColor = 'rgba(100,255,100,1)';
            resultStr = 'Won'
        }
        else if (bet.won === -1) {
            resultColor = 'rgba(255,100,100,1)';
            resultStr = 'Lost';
        }
        else if (bet.won === 2) {
            resultColor = '#9e9e9e';
            resultStr = 'Refund'
        }

        const isCross = this.isCrossBet(bet);
        const displayName = bet.username + (bet.userIP ? ` (${bet.userIP})` : '');
        const betTime = moment(bet.betTime).format('MM/DD HH:mm');
        const bookmaker = `${bet.bookmaker} - ${bet.baseBookmaker}`;
        let marketType = bet.marketType + (bet.handicap != null ? ` (${util.toPrintableNumber(bet.handicap)})` : '');
        if (isCross) {
            marketType += ' [' + bet.baseMarketType + (bet.baseHandicap != null ? ` (${util.toPrintableNumber(bet.baseHandicap)})` : '') + ']';
        }
        let selectonName = bet.selectionName;
        if (isCross) {
            selectonName += ' [' + bet.baseSelectionName + ']';
        }
        const placedStake = bet.placedStake ? bet.placedStake : null;
        const odds = util.financial(bet.placedOdds || 0).toFixed(2) + ' / ' + util.financial(bet.odds).toFixed(2) + ' / ' + util.financial(bet.baseOdds).toFixed(2);
        const profitDisplay = Number.isNaN(profit) ? 'Not Yet' : profit.toFixed(2);
        const betType = isCross ? 'Cross' : 'Straight';
        return {
            resultColor, displayName, valueX: valueX.toFixed(2),
            betTime, sport: bet.sport,
            bookmaker, eventName: bet.eventName,
            selectionName: selectonName,
            marketType, placedStake, odds,
            profit: profitDisplay, betType,
            result: resultStr
        };
    }

    render() {
        const { displayBets, totals, page, pageSize } = this.props;
        return (
            <div className={css(styles.tableWrapper)}>
                <Table className={css(styles.table)}>
                    <TableHead>
                        <TableRow>
                            {ColumnNames.map(row => (
                                <TableCell
                                    className={css(styles.tableCell)}
                                    style={{ width: row.width }}
                                    key={row.id}
                                    align={row.algin as any}
                                >
                                    {row.label}
                                </TableCell>
                            )
                            )}

                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayBets.map((bet, index: number) => {
                            const { resultColor, displayName, betTime, valueX, sport, eventName, bookmaker, marketType,
                                placedStake, selectionName, odds, profit, betType } = this.betItemToDisplay(bet);


                            return (
                                <TableRow className={css(styles.tr)} key={bet.id}>
                                    <TableCell align={ColumnNames[0].algin as any} className={css(styles.tableCell)}>
                                        <div className={css(styles.resultCircle)} style={{ backgroundColor: resultColor }}></div>
                                    </TableCell>
                                    <TableCell align={ColumnNames[1].algin as any} className={css(styles.tableCell)}>{betTime}</TableCell>

                                    <TableCell align={ColumnNames[2].algin as any} className={css(styles.tableCell)}>
                                        {displayName}
                                    </TableCell>

                                    <TableCell align={ColumnNames[3].algin as any} className={css(styles.tableCell)}>{bookmaker}</TableCell>
                                    <TableCell align={ColumnNames[4].algin as any} className={css(styles.tableCell)}>{sport}</TableCell>
                                    <TableCell align={ColumnNames[5].algin as any} className={css(styles.tableCell)}>{eventName}</TableCell>
                                    <TableCell align={ColumnNames[6].algin as any} className={css(styles.tableCell)}>{marketType}</TableCell>
                                    <TableCell align={ColumnNames[7].algin as any} className={css(styles.tableCell)}>{selectionName}</TableCell>
                                    <TableCell align={ColumnNames[8].algin as any} className={css(styles.tableCell)}>{odds}</TableCell>
                                    <TableCell align={ColumnNames[9].algin as any} className={css(styles.tableCell)}>{placedStake}</TableCell>
                                    <TableCell align={ColumnNames[10].algin as any} className={css(styles.tableCell)}>{valueX}</TableCell>
                                    <TableCell align={ColumnNames[11].algin as any} className={css(styles.tableCell)}>{betType}</TableCell>
                                    <TableCell align={ColumnNames[12].algin as any} className={css(styles.tableCell)}>{profit}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                <TablePagination
                    className={css(styles.pagination)}
                    classes={{ toolbar: css(styles.paginationToolbar), actions: css(styles.paginationAction) }}
                    component="div"
                    count={totals}
                    rowsPerPage={pageSize}
                    page={page}
                    backIconButtonProps={{
                        'aria-label': 'Previous Page',
                        style: { paddingTop: 4, paddingBottom: 4 }
                    }}
                    nextIconButtonProps={{
                        'aria-label': 'Next Page',
                        style: { paddingTop: 4, paddingBottom: 4 }
                    }}
                    onChangePage={this.handleChangePage}
                    onChangeRowsPerPage={this.handleChangeRowsPerPage}
                />

            </div>
        )
    }
}





const styles = StyleSheet.create({
    tableWrapper: {
        overflow: 'auto',
        flex: 1
    },
    table: {
        tableLayout: 'fixed'
    },
    pagination: {
        fontSize: '0.75rem',
        backgroundColor: '#F5F5F5'
    },
    paginationToolbar: {
        height: 42,
        minHeight: 42
    },
    paginationAction: {
        height: 42,
        alignItems: 'center',
        display: 'flex'
    },
    tableHeader:
    {
        width: 60,
        fontSize: '0.70rem',
        padding: '4px 36px 4px 14px'
    },
    tableCell:
    {
        fontSize: '0.70rem',
        // padding: '4px 36px 4px 14px'
        // textAlign:'center'
        paddingLeft: 18,
        paddingRight: 8,
    },
    tr: {
        backgroundColor: '#fafafa',
        ':nth-of-type(odd)': {
            backgroundColor: '#f1f8e9'
        }

    },
    resultCircle: {
        width: 15,
        height: 15,
        borderRadius: 50,
        display: 'inline-block'
    },


});
