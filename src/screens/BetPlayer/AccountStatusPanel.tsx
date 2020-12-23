import React, { PureComponent } from 'react';

import { StyleSheet, css } from 'aphrodite';
import { AccountStatus } from '../../models';


export interface Props {
    accountStatus: AccountStatus
}

interface States {
}

export default class AccountStatusPanel extends PureComponent<Props, States> {

    render() {
        const { accountStatus } = this.props;
        return (
            <React.Fragment>
                {Object.keys(accountStatus).map((bookmaker, index) => {
                    return (
                        <div key={bookmaker}>
                            <span className={css(styles.label)}>
                                {`${bookmaker}:`}
                            </span>
                            <span className={css(styles.label)}>
                                user name:
                                    </span>
                            <span className={css(styles.content)}>
                                {accountStatus[bookmaker].username}
                            </span>
                            <span className={css(styles.label)}>
                                balance:
                                    </span>
                            <span className={css(styles.content)}>
                                {accountStatus[bookmaker].balance || 0}
                            </span>
                            <span className={css(styles.label)}>
                                logged:
                                    </span>
                            <span className={css(styles.content, (accountStatus[bookmaker].logged ? styles.success : styles.error))}>
                                {'' + accountStatus[bookmaker].logged} {accountStatus[bookmaker].error || ''}
                            </span>
                        </div>
                    );
                })
                }

            </React.Fragment>
        )
    }
}

const styles = StyleSheet.create({
    label:
    {
        display: 'inline-block',
        marginRight: 5,
    },
    content:
    {
        fontWeight: 700,
        display: 'inline-block',
        marginRight: 8
    },
    error: {
        color: 'red'
    },
    success: {
        color: 'green'
    },
});
