//@ts-check
const { screen } = require('electron');
const size = screen.getPrimaryDisplay().size;
const browserWin = {
    width: size.width * 0.9,
    height: size.height * 0.9,
    show: true,
    center: true,
    resizable: true,
    webPreferences: { partition: "kingodds" }
}

module.exports = { browserWin }