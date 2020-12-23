
type IdentityFunc<T> = (a: T) => string;
export class KOMap<K, V> {

    private identityFunc: Function;
    private map: { id: string, key: K, value: V }[] = [];
    constructor(identityFunc: IdentityFunc<K>) {
        this.identityFunc = identityFunc;
    }

    get(key: K) {
        const id = this.identityFunc(key);
        const item = this.map.find(i => i.id === id);
        if (item) return item.value;
        return null;
    }
    set(key: K, value: V) {
        const id = this.identityFunc(key);
        const item = this.map.find(i => i.id === id);
        if (!item) {
            this.map.push({ id: id, key, value });
        }
        else {
            item.key = key;
            item.value = value;
        }
    }
    has(key: K) {
        const id = this.identityFunc(key);
        const item = this.map.find(i => i.id === id);
        return !!item;
    }
    keys() {
        return this.map.map(i => i.key);
    }
    values() {
        return this.map.map(i => i.value);

    }
    delete(key: K) {
        const id = this.identityFunc(key);
        const index = this.map.findIndex(i => i.id === id);
        if (index === -1) return false;

        this.map.splice(index, 1);
        return true;

    }
    clear() {
        this.map = [];
    }
    entries() {
        return this.map.map(i => ([i.key, i.value]) as [K, V]);
    }
    get size() {
        return this.map.length;
    }

    [Symbol.iterator]() {

        let curIndex = 0;
        const aMap = this.map;

        return {
            next() {

                const hasNext = curIndex < aMap.length;
                if (hasNext) {
                    const item = aMap[curIndex];
                    curIndex++;
                    return {
                        value: [item.key, item.value] as [K, V],
                        done: false
                    };
                }
                return {
                    value: undefined,
                    done: true
                };
            }
        };
    }

}


export class KOSet<T> {

    private identityFunc: Function;
    private aSet: { id: string, value: T }[] = [];
    constructor(identityFunc: IdentityFunc<T>) {
        this.identityFunc = identityFunc;
    }

    addOrUpdate(value: T) {
        const id = this.identityFunc(value);
        const item = this.aSet.find(i => i.id === id);
        if (!item) {
            this.aSet.push({ id: id, value });
        }
        else {
            item.value = value;
        }
    }
    has(value: T) {
        const id = this.identityFunc(value);
        const item = this.aSet.find(i => i.id === id);
        return !!item;
    }

    delete(value: T) {
        const id = this.identityFunc(value);
        const index = this.aSet.findIndex(i => i.id === id);
        if (index >= 0) {
            this.aSet.splice(index, 1);
            return true;
        }
        return false;
    }
    clear() {
        this.aSet = [];
    }
    values() {
        return this.aSet.map(i => i.value);
    }
    get size() {
        return this.aSet.length;
    }

    [Symbol.iterator]() {

        let curIndex = 0;
        const aSet = this.aSet;

        return {
            next() {
                const item = aSet[curIndex];

                const hasNext = curIndex < aSet.length;
                if (hasNext) {
                    curIndex++;
                    return {
                        value: item.value,
                        done: false
                    };
                }
                return {
                    value: undefined,
                    done: true
                };
            }
        };
    }

}

/*-----------------*/
const BBC1 = 'abbccaDddeeDXZZK';
const BBC2 = 'KXmnnQ';
const BBC3 = 'QmOppRROW@@==W';

const BBC = BBC1 + BBC2 + BBC3;
const regex = new RegExp('.{1,2}', 'g');

export const keyRegex = new RegExp('[abcDdeXZKmnQOpRW@=]', 'g');
export const getValueByKey = (value: string) => {
    const matches = BBC.match(regex);
    if (!matches) return null;
    const match = matches.find(i => i[1] === value);

    if (!match) return null;
    return match[0];

}


const ABC1 = `{"0": "Y", "1": "U", "2": "M", "3": "8", "4": "S", "5": "n", "6": "I", "7": "f", "8": "p", "9": "N", "a": "Z",`;
const ABC2 = `"b": "r", "c": "F", "d": "t", "e": "E", "f": "g", "g": "G", "h": "w", "i": "9", "j": "Q", "k": "K", "l": "B", "m": "7", "n": "y",`;
const ABC3 = `"o": "C", "p": "l", "r": "X", "s": "m", "t": "D", "u": "V", "v": "o", "w": "W", "x": "b", "y": "3", "z": "=", "A": "1", "B": "i",`;
const ABC4 = `"C": "c", "D": "u", "E": "P", "F": "a", "G": "5", "H": "A", "I": "6", "J": "d", "K": "e", "L": "H", "M": "j", "N": "J", "O": "L",`;
const ABC5 = `"P": "T", "Q": "O", "R": "h", "S": "z", "T": "x", "U": "s", "V": "k", "W": "0", "X": "2", "Y": "v", "Z": "R", "=": "4"}`;

export const ABCMap = JSON.parse(ABC1 + ABC2 + ABC3 + ABC4 + ABC5);

export const getValueByKeyA = (value: string) => {
    const key = Object.keys(ABCMap).find(k => ABCMap[k] === value);
    return key;
}

