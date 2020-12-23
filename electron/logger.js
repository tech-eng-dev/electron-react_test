//@ts-check
const winston = require('winston');
const fs = require('fs');
const path = require('path');

const enumerateErrorFormat = winston.format(info => {

    // @ts-ignore
    if (info.message instanceof Error) {
        info.message = Object.assign({
            message: info.message.message,
            stack: info.message.stack,
        }, info.message);
    }
    if (info instanceof Error) {
        return Object.assign({
            message: info.message,
            stack: info.stack,
        }, info);
    }
    return info;
});

const isDev = process.env.ELECTRON_ENV;
const resFolder = isDev ? path.join(__dirname, '../dev/resources') : process.resourcesPath;

const logPath = path.join(resFolder, 'logs');

if (!fs.existsSync(logPath)) {
    fs.mkdirSync(logPath)
}

const loggers = {};
for (const app of ['scrapper', 'betplayer', 'betslip', 'updater', 'global']) {
    const logger = winston.createLogger({
        format: winston.format.combine(
            winston.format.timestamp(),
            enumerateErrorFormat(),
            winston.format.json()
        ),
        transports: [
            new winston.transports.File({
                filename: path.join(logPath, `${app}.log`), maxsize: 2242880,
            }),
        ]
    });
    if (isDev) {
        logger.add(
            new winston.transports.Console());
    };

    loggers[app] = logger;
}

module.exports = { loggers }