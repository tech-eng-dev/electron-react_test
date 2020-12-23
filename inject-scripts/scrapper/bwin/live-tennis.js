//@ts-check
const Kingpin = require('../../kingpin');
const BwinCommon = require('../../shared/bwin');
const Common = require('../../shared/common');

document.addEventListener('DOMContentLoaded', () => {
	Kingpin.log('scrapping go go go!');
	Kingpin.addOverlay();

	BwinCommon.isLoaded()
		.then(val => val && scrap())
		.catch(err => Common.sendEventScrapError(err));
});

const scrap = async () => {
	try {
		const tennisEvents = [];
		//go to tennis
		try {
			await BwinCommon.goToInplay('tennis');
			// collapse all EventLists
			await BwinCommon.isLoaded();
			await Kingpin.wait(1000);

			while (1) {
				const $loadMore = await Kingpin.waitForElement('a.load-more-button', 100);
				console.log('going to click load more', $loadMore);
				if (!$loadMore) break;
				await Kingpin.simulateClick($loadMore);
				await BwinCommon.isLoaded();
			}

			const $eventsTable = await Kingpin.waitForElement('.events-table.events-table-time');

			const $events = $eventsTable.querySelector('tbody');
			const reactInstance = Common.findReactInstance($events);
			console.log(reactInstance);

			const matchInstanceArray = reactInstance._currentElement.props.children[1];
			console.log(`There are ${matchInstanceArray.length} live matches.`);

			for (const matchInstance of matchInstanceArray) {
				const event = await extractEvent(matchInstance);
				if (event) tennisEvents.push(event);
			}
		} catch (error) {
			console.error(error);
		}

		if (tennisEvents.length === 0) {
			throw new Error('No tennis  events found!');
		}

		console.log({ tennisEvents });
		Kingpin.sendIPCMsg({
			events: tennisEvents,
			msg_type: 'data-extraction'
		});
	} catch (e) {
		Common.sendEventScrapError(e);
	}
};

const extractEvent = async match => {
	try {
		console.log(match);
		const { event } = match.props;

		const name = BwinCommon.nameFormat(event.player1) + ' v ' + BwinCommon.nameFormat(event.player2);

		console.log(name);
		const eventID = match.key;
		const time = event.startDate;

		const origin = window.location.origin + window.location.pathname;
		return {
			sport: 'tennis',
			script: 'live-tennis.js',
			eventName: name,
			startTime: time,
			uuid: Kingpin.generateUUID(name, time, 'bwin', 'live'),
			url: encodeURI(`${origin}#/${eventID}`)
		};
	} catch (error) {
		console.error(error, match);
		return null;
	}
};
