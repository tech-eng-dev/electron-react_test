import { getValueByKey, keyRegex, getValueByKeyA } from "./Set";
import * as util from "./util";

//make  file name and function hard to guest so user can not get the encrypt method using erverse engine

//performance is not so good (10ms)
export const abc = (protectedData: string) => {
    const str = protectedData.replace(keyRegex, m => getValueByKey(m) || '');

    const unprotectedData = atob(str);
    return unprotectedData;
}

export const wxy = (protectedData: string) => {
    let rawData = protectedData;
    for (let i = 0; i < protectedData.length; i += 21) {
        const char = protectedData[i];
        const mapChar = getValueByKeyA(char);
        if (!mapChar) continue;

        rawData = util.strReplaceAt(rawData, mapChar, i);
    }
    const unprotectedData = atob(rawData);
    return unprotectedData;
}
