import BetslipBrowser, { Props as CommonBetSlipProps } from './BetslipBrowser';
import { KOOddsWithOption, Nullable } from '../../models';
import { util } from '../../services';

export interface Props extends CommonBetSlipProps {}

export default class BwinBrowser extends BetslipBrowser {
	//refreshTimer: Nullable<number> = undefined;
	// constructor(props: Readonly<Props>) {
	// 	super(props);
	// }

	protected async browserUnmount() {}
	protected async browserMount() {
		// await this.browser.wait(5000);
		//reload the page to keep session active
		this.turnOnPageRefreshInterval(60 * 15);
	}
	protected async getBalance() {
		const textContent = await this.browser.waitForEleText('span#user-state-account-balance');
		const balance = textContent.split(/\s/)[0];
		return '' + util.toNumber(balance);
	}
	protected async isLogged() {
		const tc = await this.browser.waitForEle('li#auth-form-container');
		console.log('not ready button?', tc);
		if (tc) return true;
		return false;
	}
	protected async login(loginUrl: string, username: string, password: string) {
		const isLogged = await this.isLogged();

		if (isLogged) return true;
		const script = `
		(() => {
			return $('a#login-overlay-button').trigger('mouseover');
		})()
		`;
		await this.browser.executeJs<boolean>(script);
		await this.browser.waitForEle('div#login-overlay-form-wrap');

		console.log('performLogin', username, password, loginUrl);

		await this.browser.waitForEle('input[name=username]');
		await this.browser.simulateInput('input[name=username]', username);

		await this.browser.waitForEle('input[name=password]');
		await this.browser.simulateInput('input[name=password]', password);

		await this.browser.wait(400);
		await this.browser.simulateClick(`button[name=submit]`);
		await this.browser.waitForEle('li#auth-form-container');
		// await this.waitUntilLoadOverlayDisappeared();

		const logged = await this.isLogged();
		return logged;
	}

	protected async placeBet(valueOdds: KOOddsWithOption) {
		const { selectionId, url } = valueOdds;

		console.log('Going to live match URL', selectionId, url);

		await this.browser.goto(url);
		await this.browser.waitForEle('lb-marketboard');

		await this.clearBetslip();
		console.log('error fromhere?');
		await this.waitUntilBetSlipLoadOverlayDisappeared();

		const foundSel = await this.ifSelExist(selectionId); // Also click the selection if existed

		if (!foundSel) {
			throw new Error('can not find the selection');
		}

		console.log(`Placing fixedReturns ${valueOdds.fixedReturns} on 
        ${valueOdds.marketType} ${valueOdds.selectionName}(unibet: ${valueOdds.odds}, base: ${valueOdds.baseOdds})`);

		const { fixedReturns, odds, roundDownDigit } = valueOdds;
		let stakeAmount = this.roundDownStakeAmount(fixedReturns / odds, roundDownDigit || 1);

		console.warn({ fixedReturns, odds, roundDownDigit, stakeAmount });

		if (stakeAmount === 0) {
			throw new Error('stake amount after round down is zero');
		}

		// 0.5 is the min

		if (stakeAmount < 0.5) {
			stakeAmount = 0.5;
		}
		await this.tryToInputStake(selectionId, odds, stakeAmount);

		// const canclled = await this.wasBetCancelled(valueOdds);
		// if (canclled) {
		// 	throw new Error(`bet has cancelled`);
		// }

		// Place Bet

		const changedOdds = eval(await this.browser.getEleText('betslip-options__option-odds-holder'));
		console.log('-------------- real, odds---------------', changedOdds);

		await this.browser.simulateClick('button[name="next"]');

		return { odds: changedOdds, stake: stakeAmount };
	}
	private async waitUntilBetSlipLoadOverlayDisappeared() {
		let hidden = false;

		return new Promise(async resolve => {
			do {
				const script = `(()=>{
					const node=$('div#waiting-screen')[0];
					if(!node)	return true;
					return node.style.display == 'none' | node.style.display == ''})()`;
				hidden = await this.browser.executeJs<boolean>(script);
				this.browser.wait(200);
			} while (!hidden);
			resolve();
		});
	}
	private async waitUntilLoadOverlayDisappeared() {
		let hidden = false;

		return new Promise(async resolve => {
			do {
				const script = `(()=>{
					const node=document.querySelector('div.loading');
					if(!node) return true;
					return node.hidden})()`;
				hidden = await this.browser.executeJs<boolean>(script);
				this.browser.wait(200);
			} while (!hidden);
			resolve();
		});
	}
	private async tryToInputStake(selectionId: string, odds: number, stake: number) {
		await this.waitUntilBetSlipLoadOverlayDisappeared();
		const exist = await this.browser.waitForEle(`input#betslip-stake`);

		if (!exist) {
			throw new Error('can not find the selection at betlsip');
		}
		// alwasy approve the odds changed
		await this.browser.simulateClick('span[data-odds-acceptance-label="Odds options"]');
		await this.browser.wait(100);
		await this.browser.simulateClick('span.odds-acceptance-option-name');
		await this.browser.wait(100);

		await this.waitUntilBetSlipLoadOverlayDisappeared();

		console.log('going to input stake amount');
		// Input stake amount
		await this.browser.executeJs<any>(`
            (() => {
				const input = $('input#betslip-stake')[0];
				const lastValue = input.value;
				input.value = '${stake}';
				
				var e = document.createEvent("KeyboardEvent");
				if (e.initKeyboardEvent) {  // Chrome, IE
					e.initKeyboardEvent("keyup", true, true, document.defaultView, "Enter", 0, "", false, "");
				} else { // FireFox
					e.initKeyEvent("keyup", true, true, document.defaultView, false, false, false, false, 13, 0);
				}
				input.dispatchEvent(e);
            })()
			`);

		// wait bet button enable
		const isEnabled = await this.browser.waitForJs(
			`
        (()=>{
            const $node=$('button[name="next"]');
            if(!$node) return false;
            return !$node.disabled;
          })()`
		);

		if (!isEnabled) {
			throw new Error(`Bet has suspended`);
		}
		//timing, maybe odds has changed after you click the "place bet" button, wait 1sec to security bet
		console.log('Not closed or suspended. Going to place bet', selectionId);
	}
	private async ifSelExist(selectionId: string) {
		const convertedSelectionId = selectionId.split('*');
		console.log(convertedSelectionId);
		const script = `
       	(() => {
			const $oddsBtnList = document.querySelectorAll('li[data-location="eventView"]');

			for (const $oddsBtn of $oddsBtnList) {
				const $sel =  $oddsBtn.firstChild;
				
				if( $sel.getAttribute('title') == '${
					convertedSelectionId[1]
				}' && $oddsBtn.parentNode.parentNode.firstChild.textContent.trim() == '${convertedSelectionId[0]}')
				{
					console.log('going to click', $sel);
					$sel.click();
					return true;
				}
			}
			return false;
        })()
        `;
		return this.browser.executeJs(script);
	}
	protected async clearBetslip() {
		if (await this.browser.waitForEle('div#betslip-type'))
			await this.browser.simulateClick('div#betslip-type input[name="removeOne"]');
		if (await this.browser.waitForEle('button.betslip-buttons__button.betslip-buttons__button--ok'))
			await this.browser.simulateClick('button.betslip-buttons__button.betslip-buttons__button--ok');
	}

	protected async waitForBetReceipt(oddsOnBet: KOOddsWithOption, placeOdds: number, placeStake: number) {
		await this.waitUntilBetSlipLoadOverlayDisappeared();
		console.log('Bet placed');
		await this.browser.wait(10000);
		let finalPlaceStake = placeStake;
		const error = await this.checkBetResultAndReturnError();
		if (error) {
			if (['RecieptNotFound', 'Odds changed', 'Bet offer suspended', 'Stake too low'].includes(error)) {
				throw new Error(error);
			} else {
				// When stake too high, it calculate the stake automatically. If the mas was 1 then we placed 0.5 before then it shows 0.5
				// and when we placed 1 then it doesn't calculate and bet will be refused.
				finalPlaceStake = Number(await this.browser.getEleValue('input[name="Stake"]'));
				// Place Bet
				await this.browser.simulateClick('button[name="next"]');
				await this.waitUntilBetSlipLoadOverlayDisappeared();

				const errorAgain = await this.checkBetResultAndReturnError();
				if (errorAgain) {
					throw new Error(errorAgain);
				}
			}
		}

		console.log('Receipt appeared...!!!!');
		// const receiptItem = await this.browser.executeJs<any>(`
		//     (() => {
		// 		const item = {
		// 			"reference":0,
		// 			"odds":0,
		// 			"stake":0,
		//         }
		//         const $reciept=document.querySelector('p.mod-KambiBC-betslip-receipt-header__receipt-id');
		//         if($reciept){
		//             item.reference=$reciept.lastChild.innerText;
		//         }
		//         const $stake=document.querySelector('span.mod-KambiBC-betslip-receipt__stake');
		//         if($stake){
		//             item.stake=$stake.innerText;
		//         }
		//         const $odds=document.querySelectorAll('div.mod-KambiBC-betslip-receipt__row');
		//         if($odds&&$odds.length>1){
		//           item.odds=  $odds[2].lastChild.innerText;
		//         }
		//         return item;
		//     })()
		// 	`);

		// console.log('Receipt:', receiptItem);

		return {
			placedStake: finalPlaceStake,
			placedOdds: placeOdds,
			reference: ''
		};
	}
	private async checkBetResultAndReturnError() {
		const result = await this.browser.executeJs(
			`
        ( ()=>{

            const $reciept=document.querySelector('div.Error.icon.GeneralError');
            const feedback=$reciept.getAttribute('data-error-type')
			
			switch(feedback){
				case "UnderMinimumStake":
					return 1;
					break;
				case "maximumStakeForSingleBetsExceeded":
					return 2;
					break;
			}

			const $ok = document.querySelector('button.etslip-buttons__button.betslip-buttons__button--ok')
			if(!$ok)
				return false;
			return 3;
        })()
    `
		);

		switch (result) {
			case false:
				return 'RecieptNotFound';
			case 1:
				return 'Stake too low';
			case 2:
				return 'Stake full amount has been already placed before';
		}
		return undefined;
	}

	protected async wasBetCancelled(oddsOnBet: KOOddsWithOption): Promise<boolean> {
		//accept the change and see if odds still valid
		const startTime = Date.now();
		let canclled = false;
		let placingOdds = Number.NaN;
		while (Date.now() - startTime < 1000 * 5) {
			const approveBtnExist = await this.browser.waitForEle(
				'button.mod-KambiBC-betslip__place-bet-btn.mod-KambiBC-betslip__approve-odds-btn',
				250
			);

			if (approveBtnExist) {
				await this.browser.simulateClick(
					'button.mod-KambiBC-betslip__place-bet-btn.mod-KambiBC-betslip__approve-odds-btn'
				);
				await this.browser.waitForEle('button.mod-KambiBC-betslip__place-bet-btn', 500);
				this.browser.wait(500);
				continue;
			}
			const strOdds = await this.browser.waitForEleText('.mod-KambiBC-betslip-outcome__odds', 500);

			placingOdds = util.toDecimalOdds(strOdds);
			const originOdds = util.toDecimalOdds(oddsOnBet.odds);
			if (placingOdds !== originOdds) {
				console.warn(`bet cancelled, odds changed,beturl: orignOdds:${oddsOnBet.odds},changed odds:${strOdds}`);
				canclled = true;
			}
			break;
		}
		if (canclled) return true;

		return this.wasValueOddsCancelled(oddsOnBet, placingOdds);
	}
}
