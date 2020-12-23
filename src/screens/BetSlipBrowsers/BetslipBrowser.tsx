import React, { ErrorInfo } from 'react';
import BookieWebView from '../../components/BookieWebView';
import { BookmakerCredential, KOOddsWithOption, KOBet, WebviewIPCMsg, WebviewContext } from '../../models';
import { util, Settings, Common } from '../../services';
export interface Props {
	onLoginStatusUpdated: (makername: string, username: string, logged: boolean, error?: string) => void;
	onBetResult: (makername: string, result: { error?: string; bet: KOBet }) => void;
	onWebviewIPC: (sender: BookieWebView, msg: WebviewIPCMsg) => void;
	onBalanceUpdated: (makername: string, balance: string) => void;
	betEnable: boolean;
	bookmaker: BookmakerCredential;
	oddsOnBet: KOOddsWithOption | null;
	devToolOpen: boolean;
	onError?: (bookmaker: BookmakerCredential, reason: string) => void;
}

interface States {
	logged: boolean;
}
export default abstract class BetslipBrowser extends React.PureComponent<Props, States> {
	protected wv: BookieWebView | null = null;

	private refreshTimer?: number = undefined;

	protected isOnBetting: boolean = false;
	state: States = { logged: false };

	async componentDidMount() {
		console.warn('BetslipBrowser componentDidMount');
		try {
			await this.browser.waitReady();
			await this.browserMount();
			await this.tryLogin();
		} catch (error) {
			console.error(error);
		}
	}

	async componentDidUpdate(prevProps: Props, prevStates: States) {
		try {
			const { logged } = this.state;
			const { betEnable, oddsOnBet } = this.props;
			console.warn(
				'componentDidUpdate,logged->onBetting->betEnable->oddsOnBet',
				logged,
				this.isOnBetting,
				betEnable,
				oddsOnBet
			);
			if (!logged && oddsOnBet !== prevProps.oddsOnBet) {
				await this.tryLogin();
			} else if (!this.isOnBetting && betEnable && oddsOnBet && oddsOnBet !== prevProps.oddsOnBet) {
				await this.tryBet();
			}
		} catch (error) {
			console.error(error);
			this.isOnBetting = false;
		}
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error('react error catched', info);
	}
	async componentWillUnmount() {
		window.clearInterval(this.refreshTimer);
		await this.browserUnmount();
	}

	private async tryBet() {
		if (!this.props.oddsOnBet) return;
		this.isOnBetting = true;

		const { name: makerName, username } = this.props.bookmaker;
		let result: { error?: string; bet: KOBet };
		try {
			const logged = await this.isLogged();
			if (!logged) {
				throw new Error('SessionTimeout');
			}

			const oddsOnBet = this.props.oddsOnBet;
			const placeResult = await this.placeBet(oddsOnBet);
			if (!placeResult) {
				throw new Error('place bet error');
			}
			const { odds, stake } = placeResult;
			const lastOdds = this.LatestValueOdds;
			const { placedOdds, reference, placedStake } = await this.waitForBetReceipt(oddsOnBet, odds, stake);

			result = {
				error: undefined,
				bet: {
					placedStake: placedStake,
					placedOdds: placedOdds,
					placedReference: reference,
					...(lastOdds || oddsOnBet)
				}
			};
		} catch (error) {
			console.error(error);
			try {
				await this.clearBetslip();
			} catch (error) {
				console.error(error);
			}
			result = {
				error: error.message || error,
				bet: { ...this.props.oddsOnBet, placedOdds: null, placedStake: null, placedReference: null }
			};
		}

		this.isOnBetting = false;
		this.props.onBetResult(makerName, result);

		if (!result.error) {
			const balance = await this.getBalance();
			this.props.onBalanceUpdated(makerName, balance);
		} else if (result.error === 'SessionTimeout') {
			this.props.onLoginStatusUpdated(makerName, username, false, result.error);
			this.setState({ logged: false });
			await this.tryLogin();
		}
	}
	private async tryLogin() {
		const { loginUrl, username, password, name: makerName } = this.props.bookmaker;

		try {
			const logged = await this.isLogged();
			if (logged) {
				this.setState({ logged: true });
				this.props.onLoginStatusUpdated(makerName, username, true);

				const balance = await this.getBalance();
				this.props.onBalanceUpdated(makerName, balance);
				return;
			}

			console.log('going to login');
			const success = await this.login(loginUrl, username, password);
			if (success) {
				this.setState({ logged: true });
				this.props.onLoginStatusUpdated(makerName, username, true);

				const balance = await this.getBalance();
				this.props.onBalanceUpdated(makerName, balance);
			} else {
				this.props.onLoginStatusUpdated(makerName, username, success, !success && 'login failure');
			}
		} catch (error) {
			console.error(error);
			this.props.onLoginStatusUpdated(makerName, username, false, error.message);
		}
	}

	protected get LatestValueOdds() {
		return this.props.oddsOnBet;
	}
	protected get browser() {
		return this.wv!.getBrowser();
	}

	protected abstract browserMount(): Promise<void>;
	protected abstract browserUnmount(): Promise<void>;
	protected abstract getBalance(): Promise<string>;
	protected abstract isLogged(): Promise<boolean>;
	protected abstract login(loginUrl: string, username: string, password: string): Promise<boolean>;
	protected abstract placeBet(vauleOdds: KOOddsWithOption): Promise<{ odds: number; stake: number } | null>;
	protected abstract waitForBetReceipt(
		vauleOdds: KOOddsWithOption,
		placeOdds: number,
		placeStake: number
	): Promise<{ reference: string; placedOdds: number; placedStake: number }>;
	protected abstract clearBetslip(): Promise<void>;

	protected abstract wasBetCancelled(oddsOnBet: KOOddsWithOption): Promise<boolean>;

	protected wasValueOddsCancelled(oddsOnBet: KOOddsWithOption, placingOdds: number): boolean {
		const lastestValueOdds = this.LatestValueOdds;
		console.log('wasValueOddsCancelled', lastestValueOdds, oddsOnBet);

		if (!lastestValueOdds) return true;

		if (lastestValueOdds.uuid !== oddsOnBet.uuid) return true;

		if (placingOdds < this.financial(lastestValueOdds.odds)) {
			console.log(
				'wasValueOddsCancelled,placing odds->oddsOnBet->lastBetOdds',
				placingOdds,
				oddsOnBet.odds,
				lastestValueOdds.odds,
				oddsOnBet,
				lastestValueOdds
			);
			return true;
		}

		const isCross = Common.isCrossBet(oddsOnBet);
		if (!isCross && placingOdds < lastestValueOdds.baseOdds) return true;

		return false;
	}

	protected turnOnPageRefreshInterval(interval: number) {
		window.clearInterval(this.refreshTimer);
		this.refreshTimer = window.setInterval(() => {
			try {
				if (!this.isOnBetting) {
					this.browser.executeJs('window.location.reload()').catch(err => console.error(err));
				}
			} catch (error) {
				console.error(error);
			}
		}, 1000 * interval);
	}
	protected roundDownStakeAmount(amount: number, roundDigit: number) {
		let roundDownAmount = Math.floor(amount);
		if (amount < roundDigit) return roundDownAmount;
		roundDownAmount = Math.floor(roundDownAmount / roundDigit) * roundDigit;

		return roundDownAmount;
	}
	protected financial(x: string | number) {
		return util.financial(x);
	}
	protected toDecimalOdds(odds: number | string) {
		return util.toDecimalOdds(odds);
	}

	WebviewError = (context: WebviewContext, reason: string) => {
		this.props.onError && this.props.onError(this.props.bookmaker, reason);
	};

	render() {
		console.warn('betslipbrowser:render');
		const { bookmaker, devToolOpen } = this.props;
		const proxyCountry = Settings.getProxyCountry(bookmaker.name);
		return (
			<React.Fragment>
				<BookieWebView
					ref={c => {
						this.wv = c!;
					}}
					session={`betslip_${bookmaker.name}`}
					context={{
						usage: 'betslip',
						bookmaker: bookmaker.name
					}}
					proxyCountry={proxyCountry}
					onError={this.WebviewError}
					src={bookmaker.homeUrl}
					script={'../preload.js'}
					onIpcMsg={this.props.onWebviewIPC}
					devToolOpen={devToolOpen}
				/>
			</React.Fragment>
		);
	}
}
