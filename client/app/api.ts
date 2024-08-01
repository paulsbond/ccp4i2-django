import useSWR from "swr";

function fullUrl(endpoint: string): string {
    const url = new URL(endpoint, "http://127.0.0.1:8000");
    if (url.pathname.charAt(url.pathname.length - 1) !== '/')
        url.pathname += '/';
    return url.href;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function get<T>(endpoint: string): T | undefined {
    const response = useSWR<T>(fullUrl(endpoint), fetcher);
    return response.data;
};

export async function post<T>(endpoint: string, body: any = {}): Promise<T> {
    const response = await fetch(fullUrl(endpoint), {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    return response.json() as T;
};
