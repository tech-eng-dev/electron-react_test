//@ts-check
/**
 * @typedef {import('../../src/models').KOGrabSelection} KOGrabSelection
 */
const Kingpin = require('../kingpin');
/**
 * @param {KOGrabSelection[]} snapshot
 * @param {KOGrabSelection[]} prevsnapshot
 * @returns {{removes?:KOGrabSelection[],updates?:KOGrabSelection[]}}
 */
const findChangedSelections = (snapshot, prevsnapshot) => {
	if (!prevsnapshot) {
		return { updates: snapshot };
	}
	//removes
	const removes = prevsnapshot.filter(i => snapshot.findIndex(z => Kingpin.isSameSelection(i, z)) === -1);
	/**
	 * @type {typeof removes}
	 */
	const updates = [];

	//add
	const adds = snapshot.filter(i => prevsnapshot.findIndex(z => Kingpin.isSameSelection(i, z)) === -1);
	updates.push(...adds);

	//updates
	const oddsUpdates = snapshot.filter(
		i =>
			prevsnapshot.findIndex(
				z => Kingpin.isSameSelection(i, z) && Kingpin.financial(i.odds) !== Kingpin.financial(z.odds)
			) >= 0
	);

	updates.push(...oddsUpdates);

	const selections = { removes: null, updates: null };
	if (removes.length > 0) selections['removes'] = removes;
	if (updates.length > 0) selections['updates'] = updates;

	return selections;
};

const isSameName = (name1, name2) => {
	const uName1 = name1.toUpperCase();
	const uName2 = name2.toUpperCase();
	return uName1.includes(uName2) || uName2.includes(uName1);
};

const isSameEventName = (name1, name2) => {
	const uName1 = name1.toUpperCase();
	const uName2 = name2.toUpperCase();

	const same = uName1 === name2;
	if (same) return true;

	const first = uName1.split(/\s+(?:vs|v)\s+/i);
	const second = uName2.split(/\s+(?:vs|v)\s+/i);

	if (first.length !== second.length) return false;
	if (first.length < 2) return false;

	return isSameName(first[0], second[0]) && isSameName(first[1], second[1]);
};

const normalizeEventName = eventName => {
	if (!eventName) return eventName;

	let evt = eventName;
	if (eventName.trim) {
		evt = eventName.trim();
	}

	const teams = evt.split(/\s+(?:vs|v)\s+/i);
	if (teams.length < 2) return evt;

	return teams[0] + ' v ' + teams[1];
};

const normalizeName = name => {
	if (!name) return name;

	let formatedName = name;
	if (name && name.trim) {
		formatedName = name.trim();
	}
	if (name === 'The Draw') {
		name = 'Draw';
	}

	if (formatedName.match(/ Women/g)) {
		formatedName = formatedName.replace(/ Women/g, ' (w)');
	}
	return formatedName;
};
const extractTeamsFromEventName = eventName => {
	if (!eventName) return null;
	const teams = eventName.trim().split(/\s+(?:vs|v)\s+/i);
	if (teams.length < 2) return null;
	return [teams[0].trim(), teams[1].trim()];
};

const findReactInstance = ele => {
	for (let key in ele) {
		if (key.startsWith('__reactInternalInstance$')) {
			return ele[key];
		}
	}
	return null;
};
const sendEventScrapError = error => {
	console.error(error);
	Kingpin.sendIPCMsg({
		error: error.message || 'scrap error',
		msg_type: 'data-extraction'
	});
};
const sendOddsExtractError = error => {
	console.error(error);
	Kingpin.sendIPCMsg({
		msg_type: 'odds-extraction',
		error: error.message || error
	});
};

module.exports = {
	findChangedSelections,
	isSameEventName,
	normalizeEventName,
	normalizeName,
	extractTeamsFromEventName,
	findReactInstance,
	sendEventScrapError,
	sendOddsExtractError
};
