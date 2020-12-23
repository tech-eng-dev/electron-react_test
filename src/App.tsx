import React, { Component } from 'react';
import Routes from './routes';
import { Provider } from 'react-redux';
import store from './reducers/store'
import './App.css';
import { auth } from './actions';
import appStyles from './styles';
import LinearProgress from '@material-ui/core/LinearProgress';
import BackendStatus from './actions/BackendStatus';
import { css, StyleSheet } from 'aphrodite';
import { AppStatusBar, AlertDialog } from './components';

import { Unsubscribe } from 'redux';

import { Settings, electionRemote, iosocket } from './services';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import ErrorBoundary from './components/cores/ErrorBoundary';
import { Nullable, AppUser } from './models';
import IOHttpHealth from './services/IOHttpHealth';

export interface Props extends RouteComponentProps {
  logout?: () => Promise<void>,
}
interface States {
  user: AppUser | undefined,
  isAuthenticated: boolean,
  loaded: boolean,
  backend: {
    status: string;
    error?: string
  },
  error?: string
}
class App extends Component<Props, States> {
  private unsubscribe: Nullable<Unsubscribe>;
  private iohttpHeath?: IOHttpHealth;
  state: States = {
    user: undefined,
    isAuthenticated: false,
    loaded: false,
    backend: { status: 'loaded' },
    error: undefined
  };

  componentDidMount() {
    this.subscribeGlobalStateChanged();

    const isLogged = store.dispatch(auth.checkIfLogged());

    this.setState({ isAuthenticated: isLogged, loaded: true });

    const { 'common.app': app, 'common.host': host } = Settings.getAppSettings();
    const ver = electionRemote.getAppVersion();
    const appName = 'Udevia';
    const postfix = host === '' ? ' Test Server' : '';
    switch (app) {
      case 'scrapper':
        document.title = `${appName} Scrapper (${ver})${postfix}`;
        break;
      case 'betplayer':
        document.title = `${appName} Bet placer (${ver})${postfix}`;
        break;
      case 'admin':
        document.title = `${appName} Server Panel (${ver})${postfix}`;
        break;
      default:
        document.title = `${appName} ${app}`;
        break;
	}

    if (app === 'test') {
      setTimeout(() => {
        this.props.history.replace('');
      }, 2000);
	}
	
    iosocket.on('io-status-change', this.onNetworkStatusChanged);
    if (app === 'betplayer') {
      this.iohttpHeath = new IOHttpHealth();
      this.iohttpHeath.on('ping_timeout', this.onHttpPingTimeout);
    }
  }
  componentWillUnmount() {
    this.unsubscribe && this.unsubscribe();
    iosocket.removeListener('io-status-change', this.onNetworkStatusChanged);
    if (this.iohttpHeath) {
      this.iohttpHeath.stop();
      this.iohttpHeath.removeAllListeners();
    }
  }
  componentDidUpdate(prevProps: Props, prevState: States) {
    if (prevState.isAuthenticated !== this.state.isAuthenticated) {
      if (this.iohttpHeath) {
        if (this.state.isAuthenticated) {
          this.iohttpHeath.monitor();
        }
        else {
          this.iohttpHeath.stop();
        }
      }
    }
  }
  subscribeGlobalStateChanged() {
    this.unsubscribe = store.subscribe(() => {
      const { auth, backend } = store.getState();

      if (auth.logged !== this.state.isAuthenticated
        || auth.user !== this.state.user
        || backend.status !== this.state.backend.status) {
        this.setState({
          isAuthenticated: auth.logged,
          user: auth.user,
          backend
        });
      }
    });
  }
  onHttpPingTimeout = (num: number) => {
    store.dispatch(auth.logout());
    this.setState({ error: 'network broken' });
    this.iohttpHeath && this.iohttpHeath.reset();
  }
  onNetworkStatusChanged = (status: string, reason: string) => {
    if (status !== 'connected' && (['OutOfCapacity', 'UserDisabled', 'MultipleLoginAtSameIP'].includes(reason))) {

      this.setState({ error: reason });

      store.dispatch(auth.logout());
    }
  }

  render() {
    const { isAuthenticated, user, loaded, backend } = this.state;
    const childProps = {
      isAuthenticated,
      user,
    };
    return (
      <Provider store={store}>
        <div className={css(styles.container)}>
          <div style={{ flex: 1 }}>
            {backend.status === BackendStatus.loading &&
              <div className={css(appStyles.loadingContainer)}>
                <LinearProgress color='secondary' />
              </div>}
            {backend.status === BackendStatus.error &&
              <div className={css(appStyles.error)}>
                {backend.error}
              </div>}
            <ErrorBoundary>
              {loaded && <Routes childProps={childProps} />}
            </ErrorBoundary>
          </div>
          <div>
            <AppStatusBar />
          </div>
          {this.state.error && <AlertDialog message={this.state.error} onClosed={() => this.setState({ error: undefined })} />}
        </div>

      </Provider>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100vh'
  }
});
export default withRouter(App);
