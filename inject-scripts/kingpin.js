// @ts-check
const { ipcRenderer, webFrame } = require('electron');

const LOG = console.log;

const log = (message, level = 'info') => LOG(message);

const injectScript = src =>
	new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.src = src;
		script.onerror = reject;
		script.onload = resolve;
		document.body.appendChild(script);
	});

const addOverlay = () => {
	const overlay = document.createElement('div');
	overlay.id = 'prevent-click-overlay';
	overlay.style.position = 'fixed';
	overlay.style.width = '100%';
	overlay.style.height = '100%';
	overlay.style.top = '0';
	overlay.style.left = '0';
	overlay.style.backgroundColor = 'rgba(0,0,0,0)';
	overlay.style.zIndex = '2000';
	document.body.appendChild(overlay);
};

const onDOMAttributesChanged = (nodes, attributes, onChange) => {
	const observer = new MutationObserver(mutations => {
		for (const mutation of mutations) {
			const { target, attributeName, oldValue } = mutation;

			if (attributes.indexOf(attributeName) >= 0) {
				onChange(target, oldValue);
			}
		}
	});

	for (const node of nodes) {
		observer.observe(node, {
			attributes: true,
			attributeOldValue: true
		});
	}
};

const onDOMTreeChanged = (node, onChange, mutationOptions) => {
	const observer = new MutationObserver(mutations => {
		onChange(mutations);
	});

	observer.observe(node, {
		childList: true,
		subtree: true,
		characterData: true,
		...mutationOptions
	});
	return observer;
};

const onIPCMsg = cb => {
	ipcRenderer.on('message', (event, msg) => {
		const { msg_type, ...rest } = msg;
		if (!msg_type) {
			console.error('invalid message format', msg);
			return;
		}
		cb &&
			cb(msg_type, {
				...rest
			});
	});
};
/**
 *
 * @param {{msg_type:string,[key:string]:any}} data
 */
const sendIPCMsg = data => {
	ipcRenderer.sendToHost('message', data);
};

const wait = time =>
	new Promise(resolve => {
		setTimeout(resolve, time);
	});

/**
 *timeout will resolve as null,
 *return fasly value (except number 0) will go to next step checking util timeout
 * otherwise, it will resolve the process function return value (not falsy value)
 * @param {*} process
 * @param {*} timeout
 */
const waitFor = (process, timeout = 20000) =>
	new Promise((resolve, reject) => {
		console.debug('waitfor ', process, timeout);
		const _resolve = resolve;
		// const _reject = reject;
		let stepTick = null;
		let startTime = Date.now();

		const nextStep = () => {
			if (Date.now() - startTime > timeout) {
				console.debug('timeout,resolove null');
				resolve(null);
				window.clearTimeout(stepTick);
				return;
			}
			stepTick = window.setTimeout(doStep, 100);
		};

		const doStep = () => {
			const pp = Promise.resolve(process());
			pp.then(data => {
				console.debug(data);
				if (data || typeof data === 'number') {
					window.clearTimeout(stepTick);
					_resolve(data);
				} else {
					nextStep();
				}
			});
		};
		//always transform result into promise as we don't know process if async or not

		const p = Promise.resolve(process());

		p.then(data => {
			console.debug(data);
			if (data || typeof data === 'number') {
				resolve(data);
			} else {
				doStep();
			}
		});
	});

const waitForVisiblity = async (selector, timeout = 20000) => {
	return await waitFor(() => {
		const $node = document.querySelector(selector);
		if ($node) {
			const visibility = window.getComputedStyle($node).visibility;
			const display = $node.offsetParent;
			if (visibility === 'visible' && display) return $node;
		}
		return null;
	}, timeout);
};
const waitForElement = (selector, timeout = 20000) =>
	new Promise((resolve, reject) => {
		// LOG(`Kingpin.waitForElement "${selector}"`);

		let check = null;
		let exit = null;
		const element = document.querySelector(selector);
		if (element) {
			resolve(element);
			return;
		}
		check = setInterval(() => {
			const element = document.querySelector(selector);

			if (element) {
				clearInterval(check);
				clearTimeout(exit);
				resolve(element);
				return;
			}
		}, 100);

		exit = setTimeout(() => {
			clearInterval(check);
			resolve(null);
		}, timeout);
	});

const hasElementClass = ($el, name) => {
	for (const className of $el.classList) {
		if (className === name) {
			return true;
		}
	}

	return false;
};
const runScriptAtFrame = (frameSelector, script, timeout) => {
	return waitFor(() => {
		try {
			const iframeNode = document.querySelector(frameSelector);
			if (!iframeNode) {
				return false;
			}

			const wf = webFrame.getFrameForSelector(frameSelector);

			return wf.executeJavaScript(script, false);
		} catch (error) {
			return null;
		}
	}, timeout || 1);
};

const processNodesOnUpdate = (selector, processNodes) => {
	const nodes = document.querySelectorAll(selector);

	if (!nodes || nodes.length === 0) {
		throw new Error(`No nodes found for "${selector}"`);
	}

	processNodes(nodes);

	const observer = new MutationObserver(mutations => {
		for (let mutation of mutations) {
			let target = mutation.target;

			if (mutation.type === 'characterData') {
				target = target.parentElement.closest(selector);
			}

			processNodes([target]);
		}
	});

	for (let node of nodes) {
		observer.observe(node, {
			subtree: true,
			characterData: true
		});
	}
};

let lastClickTime = null;

const simulateClick = (target, minimumDelay = 300, customEvent) =>
	new Promise((resolve, reject) => {
		const targetName = typeof target === 'string' ? target : printNodeInfo(target);
		// LOG(`Kingpin.simulateClick() ${targetName}`);

		const currentTime = +new Date();
		const delay = lastClickTime ? Math.max(0, minimumDelay - (currentTime - lastClickTime)) : minimumDelay;

		setTimeout(async () => {
			const $el = typeof target === 'string' ? await waitForElement(target) : target;

			if (!$el) {
				reject(`No element "${targetName}" found!`);
				return;
			}
			if (customEvent) {
				$el.dispatchEvent(customEvent);
			} else {
				const clickEvent = new MouseEvent('click', {
					bubbles: true,
					cancelable: true
				});
				$el.dispatchEvent(clickEvent);
			}

			lastClickTime = currentTime;

			resolve();
		}, delay);
	});

let lastInputTime = 0;

const simulateInput = (selector, value, timeForEle = 5000) =>
	new Promise((resolve, reject) => {
		LOG(`Kingpin.simulateInput() ${selector}`);

		const currentTime = +new Date();
		const delay = Math.max(0, 500 - (currentTime - lastInputTime));

		setTimeout(async () => {
			const $el = typeof selector === 'string' ? await waitForElement(selector, timeForEle) : selector;

			if (!$el) {
				reject(`No element "${selector}" found!`);
				return;
			}

			$el.value = value;

			$el.dispatchEvent(
				new Event('input', {
					bubbles: true,
					cancelable: true
				})
			);

			lastInputTime = currentTime;

			resolve();
		}, delay);
	});

const retryUntilDone = (process, checkIfProcessed, delay = 10, timeout = 10000) =>
	new Promise(resolve => {
		let check = setInterval(() => {
			if (checkIfProcessed()) {
				clearInterval(check);
				resolve();
				return;
			}

			process();
		}, delay);
	});

/**
 *
 * @param {string} key
 * @param {any} [value]
 */
const sessionValue = (key, value) => {
	if (value === undefined) {
		if (Object.keys(sessionStorage).indexOf(`kingpin_${key}`) === -1) {
			return undefined;
		}
		const val = JSON.parse(sessionStorage.getItem(`kingpin_${key}`));
		return val;
	}
	sessionStorage.setItem(`kingpin_${key}`, JSON.stringify(value));
};
const cookieValue = (name, value) => {
	if (value === undefined) {
		const cookieData = '; ' + window.document.cookie;
		const parts = cookieData.split('; ' + name + '=');
		if (parts.length === 2) {
			const val = parts
				.pop()
				.split(';')
				.shift();
			return val;
		}
	} else {
		document.cookie = `${name}=${value}`;
	}
};
const clearSession = key => {
	sessionStorage.removeItem(`kingpin_${key}`);
};
const clearSessions = () => {
	for (const key of Object.keys(sessionStorage)) {
		if (key.startsWith('kingpin_')) {
			sessionStorage.removeItem(key);
		}
	}
};
const goTo = (url, pushState) => {
	if (pushState) {
		window.history.pushState(null, '', url);
	} else {
		window.location.replace(url);
	}
};
const currentPageIs = url => {
	if (!url) return false;
	let url1 = window.location.href.split('?')[0].toLowerCase();
	let url2 = url.split('?')[0].toLowerCase();
	if (url1[url1.length - 1] !== '/') url1 += '/';
	if (url2[url2.length - 1] !== '/') url2 += '/';
	return url1 === url2;
};
const currentUrlContains = keyword => {
	if (!keyword) return false;
	return window.location.href.indexOf(keyword) >= 0;
};
const querySelectorByText = (selector, text) => {
	const $nodes = document.querySelectorAll(selector);
	for (const $node of $nodes) {
		if (($node.textContent || '').trim() === text) {
			return $node;
		}
	}
	return null;
};
const queryParam = key => {
	const val = new URL(window.location.href).searchParams.get(key);
	return val;
};
const printNodeInfo = $node => {
	const attrs = $node.attributes || new NamedNodeMap();
	let output = '<' + $node.nodeName + ' ';
	for (let i = attrs.length - 1; i >= 0; i--) {
		output += attrs[i].name + '=' + attrs[i].value + ' ';
	}
	output += '/>';
	return output;
};

const financial = x => {
	if (typeof x === 'string' && x.toLowerCase() === 'even') x = 2;
	//if (typeof x === 'string' && x.toLowerCase() === 'sp') x = 1;

	const match = Number.parseFloat(x)
		.toString()
		.match(/^-?\d+(?:\.\d{0,2})?/);
	if (match) {
		return +match[0];
	}
	return +x;
};

const generateUUID = (ename, time, bookmaker, mode) => {
	return ename + '-' + time.format('YYYYMMDDHHmm') + '-' + bookmaker + '-' + mode;
};

function roundUp(num, precision) {
	precision = Math.pow(10, precision);
	return Math.ceil(num * precision) / precision;
}

const toDecimalOdds = odds => {
	if (('' + odds).indexOf('/') >= 0) {
		const part = ('' + odds).split('/');
		const first = +part[0];
		const second = +part[1];
		return financial(first / second + 1);
	} else {
		if (!odds.includes('.')) {
			const tmpOdds = parseFloat(odds);
			if (tmpOdds >= 0.0) {
				return tmpOdds / 100 + 1;
			} else {
				return roundUp(-100 / tmpOdds, 3) + 1;
			}
		}
		return financial(odds);
	}
};
const roundDownStakeAmount = (amount, roundDigit) => {
	let roundDownAmount = Math.floor(amount);
	if (amount < roundDigit) return roundDownAmount;
	roundDownAmount = Math.floor(roundDownAmount / roundDigit) * roundDigit;

	return roundDownAmount;
};

/**
 *
 * @param {import('../src/models').KOGrabSelection} sel1
 * @param {import('../src/models').KOGrabSelection} sel2
 */
const isSameSelection = (sel1, sel2) => {
	return (
		sel1.marketType === sel2.marketType &&
		sel1.handicap === sel2.handicap &&
		sel1.selectionName === sel2.selectionName
	);
};
const currentPageContains = keyword => {
	if (!keyword) return false;
	return window.location.href.indexOf(keyword) >= 0;
};

const checkOnScpecificSymbol = (selector, text) => {
	const $nodes = document.querySelectorAll(selector);
	for (const $node of $nodes) {
		if (($node.textContent || '').includes(text)) {
			return $node;
		}
	}
	return null;
};
const trimWord = (text, word) => {
	let s = trimWordLeft(text, word);
	s = trimWordRight(s, word);
	return s;
};
const trimWordRight = (text, word) => {
	let s = text;
	if (text.endsWith(word)) {
		s = text.substr(0, text.lastIndexOf(word));
	}
	return s;
};
const trimWordLeft = (text, word) => {
	let s = text;
	if (text.startsWith(word)) {
		s = text.substr(word.length);
	}
	return s;
};

module.exports = {
	log,
	injectScript,
	onDOMTreeChanged,
	onDOMAttributesChanged,
	wait,
	waitFor,
	waitForElement,
	waitForVisiblity,
	hasElementClass,
	processNodesOnUpdate,
	simulateClick,
	simulateInput,
	retryUntilDone,
	addOverlay,
	goTo,
	currentPageIs,
	currentUrlContains,
	querySelectorByText,
	queryParam,
	printNodeInfo,
	sessionValue,
	clearSession,
	clearSessions,
	runScriptAtFrame,
	onIPCMsg,
	sendIPCMsg,
	financial,
	cookieValue,
	generateUUID,
	toDecimalOdds,
	roundDownStakeAmount,
	isSameSelection,
	currentPageContains,
	checkOnScpecificSymbol,
	trimWord,
	trimWordLeft,
	trimWordRight
};
