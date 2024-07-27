import useSWR, { SWRResponse } from "swr";

const fetcher = async (...args: any[]) => {
    const res = await fetch(args[0], args[1]);
    return res.json();
};

export function get<T>(endpoint: string): T | undefined {
    const url = `http://localhost:8000/${endpoint}`;
    const { data } = useSWR<T>(url, fetcher);
    return data;
}
