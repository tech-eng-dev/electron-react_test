//@ts-check
const path = require('path');
const fs = require('fs');
const fsExtra = require('fs-extra');

class Store {
  constructor() {
    const isDev = process.env.ELECTRON_ENV === 'development';
    const resFolder = isDev ? path.join(__dirname, '../dev/resources') : process.resourcesPath;
    fsExtra.ensureDirSync(resFolder);

    this.path = path.join(resFolder, 'persistent-store.json');
    this.data = parseDataFile(this.path);
  }

  /**
   * This will just return the property on the `data` object
   * @param {string} key 
   * @returns any
   */
  get(key) {
    return this.data[key];
  }

  // ...and this will set it
  set(key, val) {
    this.data[key] = val;
    fsExtra.ensureDirSync(path.dirname(this.path));
    //console.log(this.path);

    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }
}

/**
 * 
 * @param {string} filePath 
 */
function parseDataFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath).toString());
  } catch (error) {
    return {};
  }
}

// expose the class
const store = new Store();
module.exports = store;