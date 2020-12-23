
const MergeMarketTypes:{[key:string]:string} = {

    "TEAM_A_1": "European_HANDICAP",
    "TEAM_A_2": "European_HANDICAP",
    "TEAM_A_3": "European_HANDICAP",
    "TEAM_B_1": "European_HANDICAP",
    "TEAM_B_2": "European_HANDICAP",
    "TEAM_B_3": "European_HANDICAP"
}
export function getMergeMarketType(m1:string) {
    const mt = MergeMarketTypes[m1];
    if (!mt) return m1;
    return mt;
}