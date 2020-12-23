declare module 'random-useragent'{
    export function getRandom(cb:(ua:{browserName:string,osName:string,browserMajor:string,deviceType:string})=>boolean):string
}