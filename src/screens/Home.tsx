import React, { Component } from 'react';
import { connect } from 'react-redux'
import { Switch, withRouter, Redirect, RouteComponentProps } from 'react-router-dom';
import { StyleSheet, css } from 'aphrodite';
import { Settings, electionRemote } from '../services';
import { AsyncComponent } from '../components';
import ComponentRoute from '../routes/ComponentRoute';
import { AppState } from '../reducers/store';
const ScrapperScreen = AsyncComponent(() => import("./Scrapper"));
const BetPlayerScreen = AsyncComponent(() => import("./BetPlayer"));
const AdminScreen = AsyncComponent(() => import("./Admin"));
const routes = [
    { key: 'scrapper', screen: ScrapperScreen },
    { key: 'betplayer', screen: BetPlayerScreen },
    { key: 'admin', screen: AdminScreen },
];

export interface Props extends RouteComponentProps {
    forceRefreshTick: number;
}
interface States {
    forceRefresh: boolean,
    app?: string
}
class HomeContainer extends Component<Props, States> {
    state = {
        app: '',
        forceRefresh: false
    };

    componentDidMount() {
        const { 'common.app': app } = Settings.getAppSettings();
        console.log({ app });
        switch (app) {
            case 'scrapper':
                this.setState({ app: 'scrapper' });
                break;
            case 'betplayer':
                this.setState({ app: 'betplayer' });
                break;
            case 'admin':
                this.setState({ app: 'admin' });
                break;
            default:
                break;
        }
    }
    componentDidUpdate(prevProps: Props, prevState: States, snapshot: any) {
        if (prevProps.forceRefreshTick !== this.props.forceRefreshTick) {
            electionRemote.getSession('betslip').clearStorageData();
            this.setState({ forceRefresh: true });
        } else if (this.state.forceRefresh) {
            this.setState({ forceRefresh: false });
        }
    }

    render() {
        const { pathname } = this.props.location;
   
        const { app, forceRefresh } = this.state;
        if (forceRefresh) return null;

        return (
            <div className={css(styles.container)}>
                {app && pathname.indexOf(app) === -1 && <Redirect to={app} />}
                <main className={css(styles.contentContainer)}>
                    <Switch>
                        {routes.map(route => {
                            return (
                                <ComponentRoute key={route.key} path={'/' + route.key}
                                    exact={true} component={route.screen} props={{ ...this.props, forceRefresh }} />
                            );
                        })}
                    </Switch>
                </main>
            </div>
        )
    }
}

export default withRouter(connect((state: AppState) => ({ forceRefreshTick: state.session.forceRefreshTick }))(HomeContainer));


const styles = StyleSheet.create({
    container:
    {
        display: 'flex',
        alignItems: 'stretch',
        flexDirection: 'column',
        width: '100vw',
        height: '100%'
    },
    contentContainer: {
        width: '100%',
        display: 'flex',
        flex: 1,
        flexGrow: 1,
        flexDirection: 'column',
        height: 'auto',
        boxSizing: 'border-box',
    },
    logoContainer:
    {
        padding: 15,
    },
    logo:
    {
        width: 200
    },
    routeSelected: {
        border: '1px dashed grey'
    },
    title:
    {
        textAlign: 'left',
        marginLeft: 230
    }
});