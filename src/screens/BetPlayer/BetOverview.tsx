import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { StyleSheet, css } from 'aphrodite';
import { AppState } from '../../reducers/store';
import { State as ReduxBetslipState } from '../../reducers/betslip';
import AccountStatusPanel from './AccountStatusPanel';
import BetLogPanel from './BetLogPanel';
import ProfitLoss from './ProfitLost';
import { PlacedBetSearchCriteria, PlacedBetSearchResult } from '../../models';
import { Settings } from '../../services';


export interface Props {
    betslip: ReduxBetslipState;
    onListBetHistory: (criteria: PlacedBetSearchCriteria) => Promise<PlacedBetSearchResult | null>
}

interface States {
    selectedTab: number;
}

class BetOverviewContainer extends PureComponent<Props, States> {
    state: States = {
        selectedTab: 0,
    };
    componentDidMount() {
    }

    componentWillUnmount() {
    }
    onTabChanged = (event: React.ChangeEvent<{}>, value: number) => {
        this.setState({ selectedTab: value });
    };


    render() {
        const { betslip } = this.props;
        const { selectedTab } = this.state;
        const { accountStatus, betLogList } = betslip;
        const oddsPanel = Settings.getAppSettings()['betplayer.oddsPanel'];

        return (
            <div className={css(styles.container)}>
                <div style={{ padding: 15, paddingBottom: 0 }}>
                    <AccountStatusPanel accountStatus={accountStatus} />
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Tabs classes={{ root: css(styles.tabsRoot) }}
                        value={selectedTab}
                        onChange={this.onTabChanged}>
                        <Tab classes={{
                            root: css(styles.tabRoot),
                            label: css(styles.tabLabel)

                        }} label="Profit/Lost" />
                        {oddsPanel && <Tab classes={{
                            root: css(styles.tabRoot),
                            label: css(styles.tabLabel)

                        }} label="Logs" />
                        }
                    </Tabs>
                    <div style={{ flex: 1, position: 'relative' }}>
                        {
                            <React.Fragment>

                                <div style={{
                                    position: 'absolute',
                                    left: 0, right: 0, top: 0, bottom: 0,
                                    zIndex: selectedTab === 0 ? 2 : 0,
                                    backgroundColor: '#fff'
                                }}>
                                    <div className={css(styles.panelContainer)}>
                                        <ProfitLoss onRefreshBets={this.props.onListBetHistory} />
                                    </div>
                                </div>
                                {oddsPanel &&
                                    <div style={{
                                        position: 'absolute',
                                        left: 0, right: 0, top: 0, bottom: 0,
                                        zIndex: selectedTab === 1 ? 2 : 0,
                                        backgroundColor: '#fff'
                                    }}>
                                        <div className={css(styles.panelContainer)}>
                                            <BetLogPanel logs={betLogList} />
                                        </div>
                                    </div>}
                            </React.Fragment>
                        }
                    </div>
                </div>
            </div>
        )
    }
}


export default connect((state: AppState) => ({ betslip: state.betslip }))(BetOverviewContainer);


const styles = StyleSheet.create({
    container:
    {
        height: '100%',
        fontSize: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        overflowY: 'auto',
        backgroundColor: '#fff',
    },
    panelContainer:
    {
        flexDirection: 'column',
        display: 'flex',
        height: '100%',
        overflowY: 'auto'
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
