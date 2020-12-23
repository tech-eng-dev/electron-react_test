const Kingpin = require('../kingpin');

const MarketCodeMaps = {
	'Match Odds': 'MATCH_ODDS',
	'To Win': 'MATCH_ODDS',
	'Asian Handicap': 'ASIAN_HANDICAP',
	'Draw No Bet': 'DRAW_NO_BET',
	'Game Handicap': 'ASIAN_HANDICAP',
	'Total Games': 'OVER_UNDER',

	'Handicap Betting': 'EUROPEAN_HANDICAP',
	'GAME_BY_GAME_{Set}_{Game}': 'GAME_BY_GAME_{Set}_{Game}',
	'SET_WINNER_{Set}': 'SET_WINNER_{Set}',
	'Total Goals': 'OVER_UNDER',
	'Full Time': 'MATCH_ODDS',
	'Double Chance': 'DOUBLE_CHANCE',
	'Both Teams To Score': 'BOTH_TEAMS_TO_SCORE',
	'Total Goals Odd/Even': 'ODD_OR_EVEN',
	'Total Goals by Home Team': 'TEAM_A_OVER_UNDER',
	'Total Goals by Away Team': 'TEAM_B_OVER_UNDER',
	// Baseball
	'Total Runs by Home Team': 'TEAM_A_OVER_UNDER',
	'Total Runs by Away Team': 'TEAM_B_OVER_UNDER',
	'Total Runs': 'OVER_UNDER',
	Handicap: 'ASIAN_HANDICAP',
	// Tennis
	'Total Games - Match': 'OVER_UNDER',
	'Match Winner': 'MATCH_ODDS'
};

const sportIndex = {
	tennis: '5'
};

const goToInplay = async sport => {
	console.log(sport);
	window.location.hash = `#/overview/sport/${sportIndex[sport]}?sortBy=Time`;
	// const $sportsList = (await Kingpin.waitForElement(`.sportmenu-list`)).children;
	// console.log($sportsList);
	// // const $sportsList = document.querySelectorAll("li.tab");

	// let sportBtn = null;
	// for(let i = 0;i < $sportsList.length; i ++){
	// 	const $sport = $sportsList[i];
	// 	const sportsName = $sport.textContent.split(/\d+/)[0];

	// 	if( sportsName.localeCompare(sport, undefined, { sensitivity: 'base' }) === 0){
	// 		sportBtn = $sport.firstChild;
	// 		break;
	// 	}
	// 	console.log(sportsName);
	// }

	// if (!sportBtn) {
	// 	throw new Error(`can not find the ${sport} button`);
	// }

	// console.log(sportBtn);
	// await Kingpin.simulateClick(sportBtn);
};

const collapseEventLists = async selector => {
	let eventLists = await Kingpin.waitForElement(selector);
	let matchtype_cnt = 0;

	// collapse all Event Type.
	for (const eachEventType of eventLists.childNodes) {
		if (
			eachEventType.getAttribute('class') !== 'KambiBC-event-groups-header' &&
			eachEventType.childNodes[1].childNodes.length === 0
		) {
			// make collapse
			matchtype_cnt += 1;
			await Kingpin.simulateClick(eachEventType.childNodes[0]);
		}
	}

	eventLists = await Kingpin.waitForElement(selector);
	console.log(`There are ${matchtype_cnt} match types.`);

	for (const eachEventType of eventLists.childNodes) {
		if (eachEventType.getAttribute('class') === 'KambiBC-event-groups-header') {
			continue;
		}
		const liveEventList = eachEventType.childNodes[1].childNodes;
		for (const nodeEvent of liveEventList) {
			let attr = nodeEvent.getAttribute('class');
			if (
				attr ===
				'KambiBC-betoffer-labels KambiBC-betoffer-labels--with-title KambiBC-betoffer-labels--collapsable'
			) {
				const nextnode = nodeEvent.nextSibling;
				if (!nextnode) {
					await Kingpin.simulateClick(nodeEvent);
				} else {
					attr = nextnode.getAttribute('class');
					if (
						attr ===
						'KambiBC-betoffer-labels KambiBC-betoffer-labels--with-title KambiBC-betoffer-labels--collapsable'
					) {
						await Kingpin.simulateClick(nodeEvent);
					}
				}
			}
		}
	}
};

const collapseMarketLists = async () => {
	let marketContainer = await Kingpin.waitForElement('.KambiBC-list-view__column');

	if (!marketContainer) return;
	// collapse all Market Type.
	for (const curMarketPanel of [...marketContainer.childNodes]) {
		if (curMarketPanel.className.search('expanded') === -1) {
			if (!curMarketPanel.firstChild.innerText.includes('ACTION BETTING')) {
				await Kingpin.simulateClick(curMarketPanel.firstChild);
				await Kingpin.wait(500);
			}
		}
	}
};

const findMarketName = $node => {
	const $marketContainer = $node.parentNode.parentNode;
	if (!$marketContainer) return null;

	const $label = $marketContainer.querySelector('div.title');
	if (!$label) return null;
	const title = $label.textContent.trim();

	return title || null;
};

const isLoaded = async () => {
	let isLoading = true;
	let loadingFinished = false;

	setTimeout(() => {
		isLoading = false;
	}, 15000);

	while (isLoading) {
		const $loadingOverlay = await Kingpin.waitForElement('#loading-overlay');
		if ($loadingOverlay.className === '') {
			isLoading = false;
			loadingFinished = true;
		}
		await Kingpin.wait(500);
	}
	return loadingFinished;
};

const nameFormat = name => {
	// In Double Chance case.
	if (name.match('1X') || name.match('12') || name.match('X2')) {
		return name
			.replace(/1/g, 'HOME ')
			.replace(/2/g, ' AWAY')
			.replace(/X/g, 'DRAW')
			.replace(/\s+/g, ' Or ');
	}

	let corName = name;
	if (name.includes('/')) {
		// Double match
		let names = name.split('/');

		let dname1 = names[0].split(/\s/);
		dname1.shift();
		dname1 = dname1.join(' ');

		let dname2 = names[1].split(/\s/);
		dname2.shift();
		dname2 = dname2.join(' ');

		corName = dname1 + '/' + dname2;
	} else {
		// Single Match

		let temp = name.split(/\s/);
		temp.pop();
		temp = temp.join(' ');
		corName = temp;
	}

	return corName;
};

module.exports = {
	isLoaded,
	MarketCodeMaps,
	goToInplay,
	collapseEventLists,
	collapseMarketLists,
	findMarketName,
	nameFormat
};
