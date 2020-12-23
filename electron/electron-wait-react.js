const net = require('net');
const port = process.env.PORT ? (process.env.PORT - 100) : 3000;

process.env.ELECTRON_START_URL = `http://localhost:${port}`;

const client = new net.Socket();

let startedElectron = false;
const tryConnection = () => client.connect({ port: port }, () => {
    client.end();
    if (!startedElectron) {
        console.log('starting electron');
        startedElectron = true;
        const exec = require('child_process').exec;

        const npmCmd = exec('npm run electron:dev');
        npmCmd.stdout.on('data', (data) => {
            console.log(data);
        });
        npmCmd.stderr.on('data',(data)=>{
            console.error(data);
        });
    }
}
);

tryConnection();

client.on('error', (error) => {
    setTimeout(tryConnection, 1000);
});