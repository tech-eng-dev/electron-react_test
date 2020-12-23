import React, { PureComponent } from 'react';

import { StyleSheet, css } from 'aphrodite';
import { KOBetLog } from '../../models';

export interface Props {
    logs: KOBetLog[]
}

interface States {
}

export default class BetLogPanel extends PureComponent<Props, States> {

    render() {
        const { logs } = this.props;
        return (
            <div style={{padding:15}}>
                {
                    logs.map((entry, index) => {
                        const formatMsg: { data: any, msg: string } = { msg: '', data: '' };
                        if (!entry.msg) return null;

                        formatMsg.data=entry.data;
                        formatMsg.msg = entry.msg;
                        if (formatMsg.msg.length > 250) {
                            formatMsg.msg = formatMsg.msg.substr(0, 250) + '...';
                        }
                        return (
                            <div key={index} className={css(styles.line)}>
                                {
                                    `${JSON.stringify(formatMsg)}`
                                }
                            </div>
                        );
                    })
                }
            </div>
        )
    }
}

const styles = StyleSheet.create({
    line: {
        marginBottom: 10
    },
});
