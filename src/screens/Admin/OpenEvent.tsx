
import React, { PureComponent, ChangeEvent } from 'react';
import moment from 'moment';
import { StyleSheet, css } from 'aphrodite';
import { KOBookieEvent } from '../../models';

import Input from '@material-ui/core/Input';
import TablePagination from '@material-ui/core/TablePagination';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

export interface Props {
    events: KOBookieEvent[];
}

interface States {
    searchByEventName: string;
    searchByBookmaker: string;
    searchBySport: string;
    selectedModes: ('prematch' | 'live')[];
    rowsPerPage: number;
    pageIndex: number;
}

export default class OpenEvent extends PureComponent<Props, States> {


    state: States = {
        searchByEventName: '',
        searchByBookmaker: '',
        searchBySport: '',
        selectedModes: ['prematch', 'live'],
        rowsPerPage: 25,
        pageIndex: 0
    };

    componentDidMount() {
    }

    filterEvents = (events: KOBookieEvent[]) => {
        const { searchByBookmaker, searchByEventName, searchBySport, selectedModes } = this.state;

        const bmkeywords = searchByBookmaker.toLowerCase().split(',');
        const evtkeywords = searchByEventName.toLowerCase().split(',');
        const sportkeywords = searchBySport.toLowerCase().split(',');
        const eventList: KOBookieEvent[] = [];
        for (const evt of events) {

            const eventName = evt.eventName.toLowerCase();
            const bookmaker = evt.bookmaker.toLowerCase();
            const hitEvent = !searchByEventName || evtkeywords.findIndex(i => !!i && eventName.startsWith(i)) >= 0;
            const hitBookmaker = !searchByBookmaker || bmkeywords.findIndex(i => !!i && (bookmaker === i)) >= 0;
            const hitMode = selectedModes.indexOf(evt.isLive ? 'live' : 'prematch') >= 0;
            const hitSport = !searchBySport || sportkeywords.findIndex(i => !!i && (evt.sport.toLowerCase() === i)) >= 0;
            if (hitEvent && hitBookmaker && hitMode && hitSport) {
                eventList.push(evt);
            }

        }

        return eventList;
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
        const { events } = this.props;
        const { searchByBookmaker, searchByEventName, searchBySport, selectedModes, rowsPerPage, pageIndex } = this.state;

        const eventList = this.filterEvents(events);
        return (
            <div className={css(styles.container)}>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', margin: 10 }}>

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
                            style={{ marginRight: 8, width: 240, fontSize: '0.75rem' }}
                            placeholder={"Search By Sport Names (Seperated By ,)"}
                            margin="dense"
                            value={searchBySport}
                            onChange={(val) => this.setState({ searchBySport: val.currentTarget.value, pageIndex: 0 })}
                        />
                        <Input
                            style={{ marginRight: 8, fontSize: '0.75rem', width: 240 }}
                            placeholder={"Search By Bookmakers (Seperated By ,)"}
                            margin="dense"
                            value={searchByBookmaker}
                            onChange={(val) => this.setState({ searchByBookmaker: val.currentTarget.value, pageIndex: 0 })}
                        />
                        <Input
                            style={{ marginRight: 8, width: 240, fontSize: '0.75rem' }}
                            placeholder={"Search By Event Names (Seperated By ,)"}
                            margin="dense"
                            value={searchByEventName}
                            onChange={(val) => this.setState({ searchByEventName: val.currentTarget.value, pageIndex: 0 })}
                        />
                    </div>

                </div>
                <div style={{ overflow: 'auto', flex: 1, padding: 10 }}>
                    {(!eventList || eventList.length === 0) ? (<h3>No Events at the moment</h3>) :
                        (eventList.slice(rowsPerPage * pageIndex, rowsPerPage * pageIndex + rowsPerPage).map((evt, index) => {
                            const key = evt.id;

                            const eventName = `${evt.eventName} ${(evt.isLive ? '(live)' : ' (prematch)')}`;
                            return (<div key={key} className={css(styles.listItem)}>

                                <div style={{ display: 'flex', flex: 1 }}>
                                    <div style={{ padding: '5px 15px', flex: 1 }}>{evt.bookmaker}</div>
                                    <div style={{ padding: '5px 15px', flex: 1 }}>{evt.sport}</div>
                                    <div style={{ padding: '5px 15px', flex: 1 }}>  {moment(evt.startTime).format('MM-DD HH:mm')}</div>
                                    <div style={{ padding: '5px 15px', flex: 4 }}>{eventName}</div>
                                    <div style={{ padding: '5px 15px', flex: 1 }}>{'betfair:' + (evt.bfEventId ? 'Yes' : 'No')}</div>
                                    <div style={{ padding: '5px 15px', flex: 1 }}>{'pinnacle:' + (evt.pinEventId ? 'Yes' : 'No')}</div>
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
                        count={eventList.length}
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
        flexDirection: 'column'
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
