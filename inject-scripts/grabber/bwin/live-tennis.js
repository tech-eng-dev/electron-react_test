// @ts-nocheck

/**
 * @typedef {import('../../../src/models').KOGrabSelection} KOGrabSelection
 */
const Kingpin = require('../../kingpin');

const Common = require('../../shared/common');
const BwinCommon = require('../../shared/bwin');

(() => {
	let observer = null;
	let eventUrl = null;

	document.addEventListener('DOMContentLoaded', () => {
		Kingpin.log('grabbing go go go!');
		Kingpin.addOverlay();
		BwinCommon.isLoaded()
			.then(val => (val ? grab() : Common.sendOddsExtractError('redirect to home page error')))
			.catch(err => Common.sendOddsExtractError(err));
	});

	// @ts-ignore
	// @ts-ignore
	window.addEventListener('beforeunload', e => {
		console.log('window before unload');
		observer && observer.disconnect();
	});

	const grab = async () => {
		eventUrl = window.location.href;
		try {
			const $node = await Kingpin.waitForElement('lb-marketboard');
			console.log($node);
			await extractOdds();

			Kingpin.onDOMTreeChanged(
				$node,
				async () => {
					try {
						await extractOdds();
					} catch (error) {
						Common.sendOddsExtractError(error);
					}
				}, {
					attributes: true
				}
			);
		} catch (e) {
			Kingpin.log(e);
			Common.sendOddsExtractError(e);
		}
	};

	/**
	 * @type KOGrabSelection[]
	 */
	let snapshot = null;

	const extractOdds = async () => {
		console.log('shall we go?');
		if (eventUrl !== window.location.href) {
			throw new Error('EventEnd');
		}

		/**
		 * @type KOGrabSelection[]`
		 */
		const koSelections = [];
		//don't cache it, refetch when odds change

		const $oddsBtnList = document.querySelectorAll('li[data-location="eventView"]');

		for (const $oddsBtn of $oddsBtnList) {
			const mktName = BwinCommon.findMarketName($oddsBtn);
			console.log(mktName);
			const sel = transformToSelection(mktName, $oddsBtn.firstChild);
			if (!sel) continue;
			console.log(sel);
			const cached = koSelections.some(i => i.selectionId === sel.selectionId);
			if (!cached) {
				koSelections.push(sel);
			}
		}

		const prevsnapshot = snapshot;
		snapshot = koSelections;

		const changedSels = Common.findChangedSelections(snapshot, prevsnapshot);

		if (changedSels.removes || changedSels.updates) {
			console.log(changedSels);
			//  console.log({ snapshot });
			Kingpin.sendIPCMsg({
				msg_type: 'odds-extraction',
				selections: changedSels
			});
		}
	};

	/**
	 * @returns KOGrabSelection
	 */
	const transformToSelection = (mktName, $sel) => {
		const CodeMaps = BwinCommon.MarketCodeMaps;
		let mktCode = CodeMaps[mktName];
		try {
			let dumpName = $sel.getAttribute('title');
			let name = null;
			let handicap = null;

			if (mktCode === 'MATCH_ODDS') {
				console.log(mktCode);
				name = dumpName;
			} else if (mktCode === 'OVER_UNDER') {
				const temp = dumpName.split(/\s/);
				const tempHandicap = temp[1].split(/,/).join('.');
				name = temp[0];
				handicap = Number(tempHandicap);
			}
			if (!mktCode) return null;

			const selectionId = `${mktName}*${dumpName}`;
			const odds = $sel.querySelector('.value').innerText;

			const decimalOdds = Kingpin.toDecimalOdds(odds);
			return {
				selectionName: name,
				handicap,
				decimalOdds,
				selectionId,
				marketType: mktCode,
				marketId: mktCode,
				url: window.location.href
			};
		} catch (error) {
			console.error(error);
			return null;
		}
	};
})();