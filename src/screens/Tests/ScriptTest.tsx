import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { StyleSheet, css } from 'aphrodite';

import { BookieWebView } from '../../components';
import { Props as BetslipBrowserProps } from '../BetSlipBrowsers/BetslipBrowser';
import BwinBrowser from '../BetSlipBrowsers/BwinBrowser';

import { KOOddsWithOption, KOBet, WebviewIPCMsg } from '../../models';
import { Settings } from '../../services';

export interface Props extends RouteComponentProps {}
interface States {
	script: string;
	url: string;
	wvid?: string;
	bookmaker: string;
	devToolOpen: boolean;
	oddsOnBet?: KOOddsWithOption;
	strOddsOnBet: string;
	usage: 'grabber' | 'scrapper' | 'betplayer';
	betEnable: boolean;
}
class ScriptTesterContainer extends Component<Props, States> {
    state: States = {
        script: "live-tennis.js",
        url: "",
        bookmaker: "bwin",
        devToolOpen: false,
        wvid: undefined,
        usage: "betplayer",
        oddsOnBet: undefined,
        strOddsOnBet: "",
		betEnable: true
	};

	componentDidMount() {
		console.log('betplayer:componentDidMount');
	}
	componentWillUnmount() {
		console.log('betplayer:componentWillUnmount');
	}

	onUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		this.setState({ url: event.target.value });
	};
	onScriptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		this.setState({ script: event.target.value });
	};
	onExecuteClick = () => {
		if (['grabber', 'scrapper'].indexOf(this.state.usage) >= 0) {
			this.setState({ wvid: '' + Math.random(), devToolOpen: false });
		} else {
			try {
				this.setState({
					oddsOnBet: !this.state.strOddsOnBet ? null : JSON.parse(this.state.strOddsOnBet)
				});
			} catch (error) {}
		}
		setTimeout(() => {
			this.setState({ devToolOpen: true });
		}, 2000);
	};
	onBookmakerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		this.setState({ bookmaker: event.target.value });
	};
	onUsageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		this.setState({ usage: event.target.value as any });
	};

	onOddsOnBetChanged = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		this.setState({ strOddsOnBet: event.target.value as any });
	};

	onBetslipLoginStatusUpdated = (bookmaker: string, username: string, logged: boolean, error?: string) => {
		console.warn({ bookmaker, username, logged, error });
		if (logged) {
			this.setState({ betEnable: true });
		} else {
			this.setState({ betEnable: false });
		}
	};
	onBetslipBetResult = (bookmaker: string, result: { error?: string; bet: KOBet }) => {
		console.warn('onBetslipBetResult', bookmaker, result);
	};
	onBetslipBalanceUpdated = (bookmaker: string, balance: string) => {
		console.log('onbalance update', bookmaker, balance);
	};
	onWebviewIPC = async (sender: BookieWebView, msg: WebviewIPCMsg) => {
		//  console.debug('onWebviewIPc',msg);
	};

	render() {
		const { script, url, wvid, bookmaker, devToolOpen, usage, oddsOnBet, strOddsOnBet, betEnable } = this.state;
		const { 'user.betplayer.credentials': credentials } = Settings.getUserSettings();
		const { 'betplayer.bookmakers': bookmakers } = Settings.getAppSettings();
		const bmCredential = {
			...bookmakers.find(i => i.name === bookmaker),
			...credentials[bookmaker]
		};
		return (
			<div className={css(styles.container)}>
				<div style={{ display: 'flex', flexDirection: 'row' }}>
					<div>
						<span style={{ paddingRight: 15 }}>url</span>
						<input type='text' value={url} style={{ width: 500 }} onChange={this.onUrlChange} />
					</div>
					<div>
						<span style={{ paddingRight: 15 }}>script</span>
						<input type='text' value={script} style={{ width: 150 }} onChange={this.onScriptChange} />
					</div>
					<div>
						<span style={{ paddingRight: 15 }}>bookmaker</span>
						<input type='text' value={bookmaker} style={{ width: 150 }} onChange={this.onBookmakerChange} />
					</div>
					<div>
						<span style={{ paddingRight: 15 }}>usage</span>
						<input type='text' value={usage} style={{ width: 150 }} onChange={this.onUsageChange} />
					</div>
				</div>
				<div>
					<div style={{ flexDirection: 'row', display: 'flex' }}>
						<span style={{ paddingRight: 15 }}>valueOdds For Bet</span>
						<textarea
							rows={5}
							value={strOddsOnBet}
							style={{ width: '100%' }}
							onChange={this.onOddsOnBetChanged}
						/>
					</div>
				</div>
				<div>
					<button onClick={this.onExecuteClick}>Execute</button>
				</div>

				{['grabber', 'scrapper'].indexOf(usage) >= 0 && (
					<div style={{ flex: 1, position: 'relative' }}>
						<div
							style={{
								position: 'absolute',
								right: 0,
								top: 0,
								left: 0,
								bottom: 0,
								background: '#fff',
								display: 'flex',
								zIndex: 2
							}}
						>
							{wvid && (
								<BookieWebView
									key={wvid}
									session={usage}
									context={{
										usage: usage,
										bookmaker: bookmaker
									}}
									src={url}
									script={script}
									devToolOpen={devToolOpen}
									onIpcMsg={this.onWebviewIPC}
								/>
							)}
						</div>
					</div>
				)}
				{usage === 'betplayer' && (
					<div style={{ flex: 1, position: 'relative' }}>
						<div
							style={{
								position: 'absolute',
								right: 0,
								top: 0,
								left: 0,
								bottom: 0,
								background: '#fff',
								display: 'flex',
								zIndex: 2
							}}
						>
							{(() => {
								const props: BetslipBrowserProps = {
									onWebviewIPC: this.onWebviewIPC,
									onLoginStatusUpdated: this.onBetslipLoginStatusUpdated,
									onBalanceUpdated: this.onBetslipBalanceUpdated,
									onBetResult: this.onBetslipBetResult,
									betEnable: betEnable,
									bookmaker: bmCredential as any,
									oddsOnBet: !!oddsOnBet ? oddsOnBet : null,
									devToolOpen: devToolOpen
								};
								switch (bookmaker) {
									case 'bwin':
										return <BwinBrowser {...props} key={bookmaker} />;
									default:
										return null;
								}
							})()}
						</div>
					</div>
				)}
			</div>
		);
	}
}

export default withRouter(connect()(ScriptTesterContainer));

const styles = StyleSheet.create({
	container: {
		display: 'flex',
		flexDirection: 'column',
		height: '100%',
		width: '100%'
	},
	tabPos: {},
	tabsRoot: {
		minHeight: 30
	},
	tabRoot: {
		minHeight: 30,
		fontSize: '0.65rem'
	},
	tabLabel: {
		fontSize: '0.75rem'
	}
});
