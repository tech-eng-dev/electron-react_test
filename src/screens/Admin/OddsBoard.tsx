
import React, { PureComponent, ChangeEvent } from 'react';
import moment from 'moment';
import memoizeOne from 'memoize-one';
import { StyleSheet, css } from 'aphrodite';
import { util, Common } from '../../services';
import { KOOdds, ValueOddsThresholdOptions, OddsOptions } from '../../models';
import Button from '@material-ui/core/Button';
import DragHandleIcon from '@material-ui/icons/DragHandle';
import ShuffleIcon from '@material-ui/icons/Shuffle';
import OddsThresholdsDialog from './OddThresholdsDialog';
import Input from '@material-ui/core/Input';
import TablePagination from '@material-ui/core/TablePagination';
import CrossThesholdsDialog from './CrossThresholdsDialog';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

export interface Props {
    valueOddsList: KOOdds[];
    oddsThresholds?: { live: ValueOddsThresholdOptions, prematch: ValueOddsThresholdOptions };
    onOddsThresholdsUpdated?: (settings: { live: ValueOddsThresholdOptions, prematch: ValueOddsThresholdOptions }, usage: 'bet' | 'display') => void;
    usage: 'display' | 'bet'
}

interface States {
    oddsThresholdDialogOpen?: { bookmaker?: 'betfair' | 'pinnacle', type: 'straight' | 'cross' };
    searchByEventName: string;
    searchByBookmaker: string;
    searchByMarketType: string;
    searchBySport: string;
    selectedModes: ('prematch' | 'live')[];
    rowsPerPage: number;
    pageIndex: number;
}

export default class OddsBoard extends PureComponent<Props, States> {


    state: States = {
        oddsThresholdDialogOpen: undefined,
        searchByEventName: '',
        searchByBookmaker: '',
        searchByMarketType: '',
        searchBySport: '',
        selectedModes: ['prematch', 'live'],
        rowsPerPage: 25,
        pageIndex: 0
    };

    componentDidMount() {
    }


    onSaveNewStraightOddsThresholds = (bookmaker: 'pinnacle' | 'betfair') => (straightOddsThresholds: { live: OddsOptions, prematch: OddsOptions }) => {


        const { oddsThresholds, usage } = this.props;

        if (!oddsThresholds) return;
        const newOddsThresholds = { ...oddsThresholds };
        newOddsThresholds.live.straight[bookmaker] = { ...straightOddsThresholds.live };
        newOddsThresholds.prematch.straight[bookmaker] = { ...straightOddsThresholds.prematch };

        this.props.onOddsThresholdsUpdated && this.props.onOddsThresholdsUpdated(newOddsThresholds, usage);
        this.setState({ oddsThresholdDialogOpen: undefined });
    }

    momoizeOnSaveNewStraightOddsThresholds = memoizeOne(this.onSaveNewStraightOddsThresholds);

    onSaveNewCrossOddsThresholds = (crossOddsThresholds: { live: { 'betfair': number, 'pinnacle': number }, prematch: { 'betfair': number, 'pinnacle': number } }) => {

        const { oddsThresholds, usage } = this.props;
        if (!oddsThresholds) return;

        const newOddsThresholds = { ...oddsThresholds };
        newOddsThresholds.live.cross = { ...crossOddsThresholds.live };
        newOddsThresholds.prematch.cross = { ...crossOddsThresholds.prematch };

        this.props.onOddsThresholdsUpdated && this.props.onOddsThresholdsUpdated(newOddsThresholds, usage);
        this.setState({ oddsThresholdDialogOpen: undefined });
    }


    getOddColor(odds1: number, odds2: number) {
        if (odds1 > odds2) return '#0f990f';
        return '#f54545';
    }
    isCrossValueOdds = (valueOdds: KOOdds) => {
        return Common.isCrossBet(valueOdds);
    }
    filterValueOdds = (oddsList: KOOdds[]) => {
        const { valueOddsList } = this.props;
        const { searchByBookmaker, searchByEventName, searchByMarketType, searchBySport, selectedModes } = this.state;

        const bmkeywords = searchByBookmaker.toLowerCase().split(',');
        const evtkeywords = searchByEventName.toLowerCase().split(',');
        const mtkeywords = searchByMarketType.toLowerCase().split(',');
        const sportkeywords = searchBySport.toLowerCase().split(',');
        const displayOddsList: KOOdds[] = [];
        for (const odds of valueOddsList) {

            const eventName = odds.eventName.toLowerCase();
            const bookmaker = odds.bookmaker.toLowerCase();
            const baseBookMaker = odds.baseBookmaker.toLowerCase();
            const marketType = odds.marketType.toLowerCase();
            const sport = odds.sport.toLowerCase();
            const hitEvent = !searchByEventName || evtkeywords.findIndex(i => !!i && eventName.startsWith(i)) >= 0;
            const hitBookmaker = !searchByBookmaker || bmkeywords.findIndex(i => !!i && (bookmaker === i || baseBookMaker === i)) >= 0;
            const hitMarketType = !searchByMarketType || mtkeywords.findIndex(i => !!i && marketType.startsWith(i)) >= 0;
            const hitSport = !searchBySport || sportkeywords.findIndex(i => !!i && i === sport) >= 0;
            const hitMode = selectedModes.indexOf(odds.isLive ? 'live' : 'prematch') >= 0;

            if (hitEvent && hitBookmaker && hitMarketType && hitMode && hitSport) {
                displayOddsList.push(odds);
            }

        }

        return displayOddsList;
    }
    closeOddsThresholdsDialog = () => {
        this.setState({ oddsThresholdDialogOpen: undefined });
    }
    handleModeChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { selectedModes } = this.state;
        const checked = event.target.checked;
        const val: 'prematch' | 'live' = (event.target as HTMLInputElement).value as any;

        if (checked && selectedModes.indexOf(val) === -1) {
            selectedModes.push(val);
        }
        else if (!checked && selectedModes.indexOf(val) >= 0) {
            selectedModes.splice(selectedModes.indexOf(val), 1);
        }
        this.setState({ selectedModes: [...selectedModes] });
    }
    render() {
        const { valueOddsList, oddsThresholds } = this.props;
        const { searchByBookmaker, searchByEventName, searchByMarketType, searchBySport, selectedModes, rowsPerPage, pageIndex, oddsThresholdDialogOpen } = this.state;

        const displayOddsList = this.filterValueOdds(valueOddsList);
        return (
            <div className={css(styles.container)}>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', margin: 10 }}>
                    {oddsThresholds && (<div>

                        <Button size="small" color="default" style={{ fontSize: '0.65rem' }}
                            variant="outlined" onClick={() => this.setState({ oddsThresholdDialogOpen: { type: 'straight', bookmaker: 'betfair' } })}>
                            Straight  Betfair thresholds
                    </Button>
                        <Button style={{ marginLeft: 15, fontSize: '0.65rem' }} color="default" variant="outlined"
                            size="small" onClick={() => this.setState({ oddsThresholdDialogOpen: { type: 'straight', bookmaker: 'pinnacle' } })}>
                            Straight Pinnacle thresholds
                            </Button>
                        <Button style={{ marginLeft: 15, fontSize: '0.65rem' }} color="default" variant="outlined"
                            size="small" onClick={() => this.setState({ oddsThresholdDialogOpen: { type: 'cross' } })}>
                            Cross thresholds
                            </Button>
                    </div>)}
                    <div>

                        {
                            ['prematch', 'live'].map((mode) => {
                                return (
                                    <FormControlLabel key={mode}
                                        control={
                                            <Checkbox
                                                checked={selectedModes.indexOf(mode as ('prematch' | 'live')) >= 0}
                                                onChange={this.handleModeChange}
                                                value={mode}
                                            />
                                        }
                                        label={mode}
                                    />
                                );
                            })
                        }

                        <Input
                            style={{ marginRight: 8, width: 220, fontSize: '0.75rem' }}
                            placeholder={"Search By Event Names (Seperated By ,)"}
                            margin="dense"
                            value={searchByEventName}
                            onChange={(val) => this.setState({ searchByEventName: val.currentTarget.value, pageIndex: 0 })}
                        />

                        <Input
                            style={{ marginRight: 8, fontSize: '0.75rem', width: 220 }}
                            placeholder={"Search By Market Types (Seperated By ,)"}
                            margin="dense"
                            onChange={(val) => this.setState({ searchByMarketType: val.currentTarget.value, pageIndex: 0 })}
                            value={searchByMarketType}
                        />
                        <Input
                            style={{ marginRight: 8, fontSize: '0.75rem', width: 220 }}
                            placeholder={"Search By Bookmakers (Seperated By ,)"}
                            margin="dense"
                            value={searchByBookmaker}
                            onChange={(val) => this.setState({ searchByBookmaker: val.currentTarget.value, pageIndex: 0 })}
                        />
                        <Input
                            style={{ marginRight: 8, fontSize: '0.75rem', width: 220 }}
                            placeholder={"Search By Sports (Seperated By ,)"}
                            margin="dense"
                            value={searchBySport}
                            onChange={(val) => this.setState({ searchBySport: val.currentTarget.value, pageIndex: 0 })}
                        />
                    </div>

                </div>
                <div style={{ overflow: 'auto', flex: 1, padding: 10 }}>
                    {(!valueOddsList || valueOddsList.length === 0) ? (<h3>No Value Odds at the moment</h3>) :
                        (displayOddsList.slice(rowsPerPage * pageIndex, rowsPerPage * pageIndex + rowsPerPage).map((valueOdds, index) => {
                            const key = valueOdds.uuid;
                            const isCross = this.isCrossValueOdds(valueOdds);
                            const age = Math.round((Date.now() - (+new Date(valueOdds.occurAt))) / 1000);
                            let ageStr = null;
                            if (age < 60) ageStr = age + ' Sec';
                            else {
                                ageStr = Math.floor(age / 60) + ' Mins';
                            }

                            let valueX = 0;
                            if (isCross) {
                                valueX = Math.floor(((1 - (1 / valueOdds.odds + 1 / valueOdds.baseOdds)) * 100));
                            }
                            else {
                                valueX = Math.floor(((valueOdds.odds - valueOdds.baseOdds) / Math.abs(valueOdds.baseOdds)) * 100);
                            }
                            return (<div key={key} className={css(styles.listItem)}>

                                <div style={{ display: 'flex', flex: 5 }}>
                                    <div style={{ marginRight: 15 }}>{valueOdds.sport}</div>
                                    <div style={{ marginRight: 15 }}>{valueOdds.eventName}</div>
                                    <div>{moment(valueOdds.eventTime).format('MM-DD HH:mm') + (valueOdds.isLive ? ' (live)' : ' (prematch)')}</div>
                                    <div style={{ color: '#757575', paddingLeft: 5 }}>{`(${ageStr})`}</div>
                                </div>

                                <div style={{ flex: 5, display: 'flex', flexDirection: 'column' }}>

                                    <div style={{ display: 'flex', flex: 1, alignItems: 'flex-end', marginBottom: 8 }}>
                                        <div style={{ width: 100, paddingRight: 8 }}>{valueOdds.bookmaker}</div>
                                        <div style={{ flex: 1, textAlign: 'right', paddingRight: 8 }}>{valueOdds.marketType + (valueOdds.handicap != null ? ' (' + util.toPrintableNumber(valueOdds.handicap) + ')' : '')}</div>
                                        <div style={{ flex: 1, textAlign: 'right', paddingRight: 8 }}>{valueOdds.selectionName}</div>
                                        <div style={{ color: isCross ? '#9c27b0' : this.getOddColor(valueOdds.odds, valueOdds.baseOdds), width: 40, textAlign: 'right', paddingRight: 15 }}>{valueOdds.odds.toFixed(2)}</div>
                                    </div>

                                    <div style={{ display: 'flex', flex: 1, alignItems: 'flex-end' }}>
                                        <div style={{ width: 100, paddingRight: 8 }}>{valueOdds.baseBookmaker}</div>
                                        <div style={{ flex: 1, textAlign: 'right', paddingRight: 8 }}>{valueOdds.baseMarketType + (valueOdds.baseHandicap != null ? ' (' + util.toPrintableNumber(valueOdds.baseHandicap) + ')' : '')}</div>
                                        <div style={{ flex: 1, textAlign: 'right', paddingRight: 8 }}>{valueOdds.baseSelectionName}</div>
                                        <div style={{ color: '#666', width: 40, textAlign: 'right', paddingRight: 15 }}>{valueOdds.baseOdds.toFixed(2)}</div>
                                    </div>
                                </div>
                                <div style={{
                                    alignSelf: 'center',
                                    width: 35, paddingRight: 5, paddingLeft: 5, color: '#90a4ae', display: 'flex',
                                    alignItems: 'center', flexDirection: 'column', justifyContent: 'center'
                                }}
                                    title={!isCross ? 'straight check' : 'cross check'}>
                                    <div><span>{valueX + '%'}</span> </div>
                                    <div><span>{!isCross ? <DragHandleIcon fontSize={"small"} /> : <ShuffleIcon fontSize="small" />}</span> </div>
                                </div>

                            </div>)
                        }))
                    }
                </div>
                <div>
                    <TablePagination
                        classes={{ toolbar: css(styles.paginationToolbar), actions: css(styles.paginationAction) }}
                        className={css(styles.pagination)}
                        component="div"
                        count={displayOddsList.length}
                        rowsPerPage={rowsPerPage}
                        page={pageIndex}
                        backIconButtonProps={{
                            'aria-label': 'Previous Page',
                            style: { paddingTop: 4, paddingBottom: 4 }
                        }}
                        nextIconButtonProps={{
                            'aria-label': 'Next Page',
                            style: { paddingTop: 4, paddingBottom: 4 }
                        }}
                        onChangePage={(evt, page) => this.setState({ pageIndex: page })}
                        onChangeRowsPerPage={(evt) => this.setState({ rowsPerPage: +evt.target.value })}
                    />
                </div>

                {
                    oddsThresholdDialogOpen && oddsThresholds &&
                    (() => {
                        const { type, bookmaker } = oddsThresholdDialogOpen;

                        if (type === 'cross') {
                            return (<CrossThesholdsDialog
                                liveOddsThresholds={oddsThresholds.live.cross}
                                prematchOddsThreholds={oddsThresholds.prematch.cross}
                                onClosed={this.closeOddsThresholdsDialog}
                                onSave={this.onSaveNewCrossOddsThresholds} />);
                        }
                        else {

                            if (!bookmaker) return null;
                            return (<OddsThresholdsDialog
                                title={`Odds Thresholds Settings For ${bookmaker}`}
                                subhead={`Odds Thresholds (%)= (bookie odds - ${bookmaker} odds)/${bookmaker} odds * 100`}
                                liveOddsThresholds={oddsThresholds.live.straight[bookmaker]}
                                premtachOddsThresholds={oddsThresholds.prematch.straight[bookmaker]}
                                onClosed={this.closeOddsThresholdsDialog}
                                onSave={this.momoizeOnSaveNewStraightOddsThresholds(bookmaker)} />)
                        }
                    })()

                }

            </div>
        )
    }
}
const styles = StyleSheet.create({
    container:
    {
        flex: 1,
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        height:'100%',
        overflowY: 'auto'
    },
    listItem:
    {
        display: 'flex',
        borderBottom: '1px solid rgba(224, 224, 224, 1)',
        padding: '5px',
        fontSize: '0.75rem',
        alignItems: 'center',
        backgroundColor: '#fafafa',
        ':nth-of-type(odd)': {
            backgroundColor: '#f1f8e9'
        }

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
});
