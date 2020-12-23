import React from "react";
import { connect } from 'react-redux';
import Typography from '@material-ui/core/Typography';
import { iosocket } from '../services';
import { css, StyleSheet } from 'aphrodite';
import { AppStatusItem, AppReduxState } from "../models";

export interface Props {
    statusItems: AppStatusItem[];
}
class AppStatusContainer extends React.Component<Props, { networkStatus?: string }> {
    constructor(props: Props) {
        super(props);
        this.state = { networkStatus: undefined };
    }
    componentDidMount() {
        iosocket.on('io-status-change', this.onNetworkStatusChanged);
    }
    componentWillUnmount() {
        iosocket.removeListener('io-status-change', this.onNetworkStatusChanged);
    }

    onNetworkStatusChanged = (status: string, args: any) => {
        this.setState({ networkStatus: status + ' ' + (args || '') });
    }
    render() {
        const { statusItems } = this.props;
        return (
            <div className={css(styles.container)}>
                <Typography variant="caption" color="inherit" className={css(styles.item)}>
                    {`network: ${this.state.networkStatus || ''}`}
                </Typography>
                {
                    statusItems.map(item => {
                        if (!item.label) return null;
                        return (<Typography variant="caption" color="inherit" key={item.key} className={css(styles.item)}>
                            {`${item.label || ''}: ${item.content || ''}`}
                        </Typography>);
                    })
                }
            </div>
        );
    }
}
export default (connect(
    (state: AppReduxState) => ({
        statusItems: state.session.statusItems
    }),
)(AppStatusContainer));

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderColor: '',
        padding: '5px 15px',
        backgroundColor: '#6A528F',
        color: 'white',
        display: 'flex'
    },
    item:
    {
        marginRight: 15,
        display: 'inline-block'
    }
});