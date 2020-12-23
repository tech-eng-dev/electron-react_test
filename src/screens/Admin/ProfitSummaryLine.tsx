import React from 'react';
import { ProfitSummary } from '../../models';
import { util } from '../../services';
import { css, StyleSheet } from 'aphrodite/no-important';

const ProfitSummaryLine = ({ summary }: { summary: ProfitSummary }) => {
    return (
        <div className={css(styles.plinfoCont)}>
            <p>
                <span style={{ fontWeight:'normal', backgroundColor: (+summary.pl) > 0 ? 'rgba(100,255,100,0.5)' : 'rgba(255,100,100,0.5)' }}>
                    PL: {Math.round(summary.pl)}&nbsp;
                            Rollover: {Math.round(summary.rollover)}&nbsp;
                            Roi: {util.toPrintableNumber(util.financial(summary.pl / summary.rollover * 100))}%&nbsp;
                            Pending Bets: {summary.pendingBets}&nbsp;
                            Won Bets: {summary.wonBets}&nbsp;
                            Lost Bets: {summary.lostBets}&nbsp;
                        </span>
            </p>
        </div>
    )
}
export default ProfitSummaryLine;

const styles = StyleSheet.create({
    plinfoCont: {
        marginLeft: 15,
        fontSize: '0.75rem'
    },
});