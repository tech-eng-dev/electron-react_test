import Settings from "./Settings";
import * as AppContext from "./AppContext";

export const get = async (endpoint: string, protectedEP: boolean, query?: { [key: string]: boolean | string | number | null | undefined }) => {

    try {
        const token = (AppContext.getUser() || { token: null }).token;

        const rootUrl = getRootUrl();
        let url = rootUrl + endpoint;
        if (query) {
            const search = new URLSearchParams();
            Object.keys(query).forEach(name => {
                if (query[name] != null) {
                    const pv = query[name];
                    let para = pv;
                    if (Array.isArray(pv)) {
                        para = pv.join(',');
                    } else if (typeof pv === 'boolean') {
                        if (pv) para = '1';
                        else para = '0';
                    }
                    search.append(name, '' + para);
                }
            });
            url += '?' + search.toString();
        }
        const headers: { [key: string]: string } = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Access-Control-Allow-Methods': '*'
        };
        if (protectedEP) {
            headers['Authorization'] = `jwt ${token}`;
        }
        const res = await fetch(url, {
            method: 'GET',
            headers
        });
        const data = await res.json();
        return { code: res.status, res: data };
    } catch (error) {
        console.error(error);
        return { code: 500, res: { error: error } };
    }

}

export const post = async (endpoint: string, protectedEP: boolean, body?: { [key: string]: any }) => {
    try {
        const token = (AppContext.getUser() || { token: null }).token;
        const url = getRootUrl() + endpoint;

        const headers: { [key: string]: string } = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Access-Control-Allow-Methods': '*'
        };
        if (protectedEP) {
            headers['Authorization'] = `jwt ${token}`;
        }

        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        const data = await res.json();
        return { code: res.status, res: data };
    } catch (error) {
        console.error(error);
        return { code: 500, res: { error } };
    }

}

const getRootUrl = () => {
    const { 'common.host': host, 'common.port': port } = Settings.getAppSettings();
    const root = `http://${host}:${port + 1}`;
    return root;
}