import io from 'socket.io-client';
import { EventEmitter } from 'events';
import Settings from './Settings';
import { AppError, IOMessage } from '../models';
import { getAppVersion } from './electionRemote';
import { AppContext } from '.';

class IOSocket extends EventEmitter {
    private socket?: SocketIOClient.Socket;
    private host?: string;
    private port?: number;
    constructor(host: string, port: number) {
        super();

        this.host = host;
        this.port = port;
    }
    open() {
        console.log('open iosocket');
        return new Promise<Boolean>((resolve, reject) => {
            //try close if open before
            this.close();

            const token = (AppContext.getUser() || { token: null }).token;
            const appVer = getAppVersion();

            const socket = io(`http://${this.host}:${this.port}?token=${token}&appver=${appVer}`, { transports: ['websocket'] });
            socket.on('connect', () => {
                if (socket.connected) {
                    this.emit('io-status-change', 'connected');
                    resolve(true);
                }
            });


            socket.on('reconnect', (attemptNumber: number) => {
                this.emit('io-status-change', 'reconnected', attemptNumber);
            });
            socket.on('connect_error', (error: AppError) => {
                console.log('connect_error', error);
                this.emit('io-status-change', 'error', (error.message || error));
                reject(error);
            });

            socket.on('connect_timeout', (timeout: string) => {
                this.emit('io-status-change', 'connect_timeout', timeout);
            });
            socket.on('error', (error: AppError) => {
                this.emit('io-status-change', 'error', (error.message || error));
                reject(error);
            });
            socket.on('disconnect', (reason: string) => {
                this.emit('io-status-change', 'disconnected', reason);

                console.warn('disconnect', reason);
                if (reason === 'io server disconnect') {
                    // the disconnection was initiated by the server, you need to reconnect manually
                    console.log('io server disconnect');
                    socket.connect();
                }
                // else the socket will automatically try to reconnect
            });
            socket.on('reconnecting', (attemptNumber: number) => {
                this.emit('io-status-change', 'reconnecting', attemptNumber);
            });
            socket.on('reconnect_failed', () => {
                this.emit('io-status-change', 'reconnect_failed');
            });

            socket.on('reconnect_error', (error: AppError) => {
                this.emit('io-status-change', 'reconnect_error', (error.message || error));
            });

            socket.on('message', (data: IOMessage, cb: Function) => {
                console.debug('got', data);
                const { msg_type } = data;
                this.emit(msg_type, { ...data, cb });
            });
            this.socket = socket;
        });
    }
    sendMessage(message: IOMessage) {

        if (!message || !message.msg_type) {
            throw new Error('invaid message data');
        }
        if (!this.socket || !this.socket.connected) {
            throw new Error('socket closed');
        }

        console.debug('sent', message);

        this.socket.emit('message', message);

    }
    sendMessageWaitAck(message: IOMessage, timeout?: number) {
        return new Promise<IOMessage>((resolve, reject) => {
            if (!message || !message.msg_type) {
                reject('invaid message data');
                return;
            }
            if (!this.socket) {
                reject('socket closed');
                return;
            }

            console.log('sent', message);


            const tick = window.setTimeout(() => {
                resolve({ error: 'timeout', msg_type: 'ack-msg' });
            }, timeout || (10 * 1000));


            this.socket.emit('message', message, (data: IOMessage) => {
                clearTimeout(tick);
                resolve(data);
            });
        });
    }

    close() {
        if (this.socket) {
            console.log('close iosocket', !!this.socket);
            this.socket.removeAllListeners();
            this.socket.close();
        }
        this.socket = undefined;
    }
}

let { 'common.host': host, 'common.port': port } = Settings.getAppSettings();
const iosocket = new IOSocket(host, port);
export default iosocket;