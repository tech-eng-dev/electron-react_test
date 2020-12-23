import React from 'react';
import Paper from '@material-ui/core/Paper';
import { css, StyleSheet } from 'aphrodite/no-important';
import { UserProfit, ProfitSummary } from '../../models';
import { util } from '../../services';
import IconButton from '@material-ui/core/IconButton';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp';
import ProfitSummaryLine from './ProfitSummaryLine';

export interface Props {
    userProfits: UserProfit[]

}
interface States {
    expandedTags: string[];
}


export default class ProfitLostDetails extends React.PureComponent<Props, States>{
    state: States = {
        expandedTags: []
    };

    tagList = (profits: UserProfit[]) => {
        const tagList: string[] = [];
        for (const u of profits) {
            const exist = tagList.some(i => i.toLowerCase() === u.tags.toLowerCase());
            if (!exist) {
                tagList.push(u.tags);
            }
        }
        return tagList.sort((a, b) => a.localeCompare(b));
    }

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
    handleTagExpand = (tag: string) => {
        const { expandedTags } = this.state;
        if (expandedTags.includes(tag)) {
            expandedTags.splice(expandedTags.indexOf(tag), 1);
        }
        else {
            expandedTags.push(tag);
        }
        this.setState({ expandedTags: [...expandedTags] });
    }
    render() {
        const { userProfits } = this.props;
        const { expandedTags } = this.state;

        const tags = this.tagList(userProfits);
        const totalSummary = this.getBetTotalSummary(userProfits);
        return (
            <Paper style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
            }}>

                <div style={{
                    paddingLeft: 15, display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center'
                }}>
                    <p style={{ fontWeight: 'bold' }}>Totals:</p><ProfitSummaryLine summary={totalSummary} />
                </div>
                <div style={{ flex: 1, overflow: 'auto' }}>
                    <div className={css(styles.table)}>

                        {tags.map(tag => {
                            const tagProfits = userProfits
                                .filter(i => i.tags.toLowerCase() === tag.toLowerCase())
                                .sort((a, b) => a.username.localeCompare(b.username));
                            const tagSummary = this.getBetTotalSummary(tagProfits);
                            return (
                                <div key={tag} className={css(styles.subTable)}>
                                    <div className={css(styles.tableRow, styles.tableHeader)}>
                                        <p>{tag}</p>
                                        <ProfitSummaryLine summary={tagSummary} />
                                        <div>
                                            <IconButton onClick={() => this.handleTagExpand(tag)} color="primary">
                                                {expandedTags.includes(tag) ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
                                            </IconButton>
                                        </div>
                                    </div>
                                    {expandedTags.includes(tag) &&
                                        (<div className={css(styles.subTableContent)}>
                                            <div className={css(styles.tableRow, styles.tableHead)}>
                                                <div className={css(styles.tableCell)} style={{ width: 220 }}>Username</div>
                                                <div className={css(styles.tableCell)} style={{ width: 120 }}>Profit</div>
                                                <div className={css(styles.tableCell)} style={{ width: 120 }}>Rollover</div>
                                                <div className={css(styles.tableCell)} style={{ width: 120 }}>Roi</div>
                                                <div className={css(styles.tableCell)} style={{ width: 120 }}>Total Bets</div>
                                                <div className={css(styles.tableCell)} style={{ width: 120 }}>won Bets</div>
                                                <div className={css(styles.tableCell)} style={{ width: 120 }}>Lost Bets</div>
                                                <div className={css(styles.tableCell)} style={{ width: 120 }}>Pending Bets</div>
                                            </div>
                                            {tagProfits.map((profit, index) => {
                                                const roi = util.toPrintableNumber(util.financial(profit.pl / profit.rollover * 100)) + '%';
                                                return (
                                                    <div className={css(styles.tableRow, profit.pl > 0 ? styles.greenRow : styles.redRow)}
                                                        key={profit.userId}>
                                                        <div className={css(styles.tableCell)} style={{ width: 220 }}>{profit.username}</div>
                                                        <div className={css(styles.tableCell)} style={{ width: 120 }}>{Math.round(profit.pl)}</div>
                                                        <div className={css(styles.tableCell)} style={{ width: 120 }}>{Math.round(profit.rollover)}</div>
                                                        <div className={css(styles.tableCell)} style={{ width: 120 }}>{roi}</div>
                                                        <div className={css(styles.tableCell)} style={{ width: 120 }}>{profit.totalBets}</div>
                                                        <div className={css(styles.tableCell)} style={{ width: 120 }}>{profit.wonBets}</div>
                                                        <div className={css(styles.tableCell)} style={{ width: 120 }}>{profit.lostBets}</div>
                                                        <div className={css(styles.tableCell)} style={{ width: 120 }}>{profit.pendingBets}</div>
                                                    </div>
                                                )
                                            })}
                                        </div>)
                                    }
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Paper>
        );
    }
}


const styles = StyleSheet.create({

    table: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        fontSize: '0.75rem',
        fontWeight: 500,
        marginBottom: 10
    },
    tableRow: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        borderBottom: '1px solid rgba(224, 224, 224, 1)'
    },
    greenRow: { backgroundColor: '#dcedc8' },
    redRow: { backgroundColor: '#ffcdd2' },
    tableHead: {
        fontSize: '0.75rem',
        color: 'rgba(0, 0, 0, 0.54)',
        height: 48

    },
    subTable: {

        display: 'flex',
        flexDirection: 'column',
    },
    subTableContent: {
        marginLeft: 60,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid rgba(224, 224, 224, 1)'
    },
    tableHeader: {
        paddingLeft: 18,
        paddingRight: 8,
        paddingTop: 8,
        paddingBottom: 8,
        fontWeight: 'bold',
        fontSize: '0.85rem'
    },
    tableCell: {
        paddingLeft: 18,
        paddingRight: 8,
        paddingTop: 10,
        paddingBottom: 10
    }


});


