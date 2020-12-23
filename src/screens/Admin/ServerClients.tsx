
import React, { PureComponent } from 'react';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Table from '@material-ui/core/Table';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import Divider from '@material-ui/core/Divider';

import { css, StyleSheet } from 'aphrodite';
import { KOServerClient, KOBookieEvent } from '../../models';

export interface Props {
    clients: KOServerClient[];
}

interface States {
}

class ServerClients extends PureComponent<Props, States> {

    componentDidMount() {
    }


    render() {
        const { clients } = this.props;

        if (clients == null) return null;

        const sortClients = clients.sort((a, b) => (a.uname + a.uip).localeCompare(b.uname + b.uip));
        const totalClients = clients.length;

        const totalEvents: { uname: string, sid: string, uip: string, event: KOBookieEvent }[] = [];
        for (const c of clients) {
            for (const e of c.grabbings) {
                totalEvents.push({ uname: c.uname, sid: c.sid, uip: c.uip, event: e });
            }
        }
        const vers = [...new Set(clients.map(i => i.appVer))];

        return (
            <Paper className={css(styles.container)}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', justifyContent: 'flex-start', alignItems: 'center' }}>
                        <Typography variant="body2" style={{ padding: 10 }}>total Players</Typography>
                        <Typography variant="body2">{totalClients}</Typography>
                        <Typography variant="body2" style={{ padding: 10 }}>total Grabbings</Typography>
                        <Typography variant="body2">{totalEvents.length}</Typography>
                        <Typography variant="body2" style={{ padding: 10 }}>Versions</Typography>
                        <Typography variant="body2">{vers.join(',')}</Typography>
                    </div>

                    <Divider />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
                        <div className={css(styles.playerPanel)}>
                            <Table style={{ tableLayout: 'fixed' }}>
                                <TableHead>
                                    <TableRow className={css(styles.tr)}>
                                        {['Player', 'Grabbings'].map((columnName, index) => {
                                            return (
                                                <TableCell className={css(styles.td)} key={'client_' + index}
                                                    {...(index === 0 ? null : { style: { width: 50 } })}>{columnName}</TableCell>)
                                        })}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sortClients.map(c => {
                                        return (
                                            <TableRow key={c.sid} className={css(styles.tr)}>
                                                <TableCell className={css(styles.td)}>
                                                    {c.uname + `(${(c.uip || c.sid)}) - ${c.appVer}`}
                                                </TableCell>
                                                <TableCell className={css(styles.td)}>
                                                    {c.grabbings.length}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        <div className={css(styles.grabPanel)}>

                            <Table style={{ tableLayout: 'fixed' }}>
                                <TableHead>
                                    <TableRow className={css(styles.tr)}>
                                        {['Event', 'Grabber'].map((columnName, index) => {
                                            return (
                                                <TableCell className={css(styles.td)} key={'grabings_' + index}
                                                    {...(index === 1 ? { style: { width: 300 } } : null)}>{columnName}</TableCell>)
                                        })}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {totalEvents.map(c => {
                                        return (
                                            <TableRow key={c.uname + '_' + c.event.uuid} className={css(styles.tr)}>
                                                <TableCell className={css(styles.td)}>
                                                    {c.event.uuid}
                                                </TableCell>
                                                <TableCell className={css(styles.td)}>
                                                    {c.uname + ' - ' + c.sid}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>



                </div>
            </Paper>
        );
    }
}

const styles = StyleSheet.create({

    container: {
        flex: 1, display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        overflow: 'auto'
    },
    playerPanel: {

        flex: 3,
        borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        overflowY: 'auto'
    },

    grabPanel: {

        flex: 7,
        overflowY: 'auto'
    },
    tr: {
        height: 36,
        ':nth-of-type(odd)': {
            backgroundColor: '#fafafa'
        }
    },
    td:
    {
        fontSize: '0.70rem',
        padding: '4px 15px'
    },
    label:
    {
        fontWeight: 500
    },
    labelContent:
    {
        marginRight: 8
    }
});

export default ServerClients;

