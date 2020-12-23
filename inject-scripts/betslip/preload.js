const Kingpin = require('../kingpin');
window.__kingpin = Kingpin;
document.addEventListener('DOMContentLoaded', () => {
	Kingpin.log('betslip go go go!');
	Kingpin.addOverlay();
});
