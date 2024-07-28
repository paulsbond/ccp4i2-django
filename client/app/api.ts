import useSWR from "swr";

function fullUrl(url: string | URL): string {
    url = new URL(url, "http://127.0.0.1:8000");
    if (url.pathname.charAt(url.pathname.length - 1) !== '/')
        url.pathname += '/';
    return url.href;
};

async function fetcher(
    input: string | URL | globalThis.Request,
    init?: RequestInit
): Promise<any> {
    const response = await fetch(input, init);
    return response.json();
};

export function get<T>(url: string): T | undefined {
    const response = useSWR<T>(fullUrl(url), fetcher);
    return response.data;
};

export async function post<T>(url: string, body: any = {}): Promise<T> {
    const response = await fetch(fullUrl(url), {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    return response.json() as T;
};
