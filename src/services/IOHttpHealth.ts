import { EventEmitter } from "events";
import { iohttp } from ".";
const MAX_PING_NUMBER = 12;
export default class IOHttpHealth extends EventEmitter {

    private pingFailureNum: number = 0;
    private timeTick?: number;
    monitor() {
        window.clearInterval(this.timeTick);
        this.timeTick = window.setInterval(async () => {
            try {
                const { res } = await iohttp.post('/ping', false);
                if (res !== 'ok') {
                    this.pingFailureNum++;
                }
                else {
                    this.pingFailureNum = 0;
                }
            } catch (error) {
                console.error(error);
                this.pingFailureNum++;
            }
            if (this.pingFailureNum > MAX_PING_NUMBER) {
                this.emit('ping_timeout', this.pingFailureNum);
            }
        }, 1e4);
    }

    reset() {
        this.pingFailureNum = 0;
    }
    stop() {
        window.clearInterval(this.timeTick);
    }

}
