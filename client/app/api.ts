import useSWR from "swr";

async function fetcher(input: string | URL | globalThis.Request, init?: RequestInit) {
    const response = await fetch(input, init);
    return response.json();
};

function fullUrl(url: string | URL): string {
    url = new URL(url, "http://127.0.0.1:8000");
    if (url.pathname.charAt(url.pathname.length - 1) !== '/')
        url.pathname += '/';
    return url.href;
};

export function get<T>(url: string): T | undefined {
    const response = useSWR<T>(fullUrl(url), fetcher);
    return response.data;
};
