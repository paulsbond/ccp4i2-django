import useSWR, { useSWRConfig } from "swr";

export function useApi() {
  const { mutate } = useSWRConfig();

  const fetcher = (url: string) => fetch(url).then((r) => r.json());

  function fullUrl(endpoint: string): URL {
    const url = new URL(endpoint, "http://127.0.0.1:8000");
    if (url.pathname.charAt(url.pathname.length - 1) !== "/")
      url.pathname += "/";
    return url;
  }

  function handleMutate(url: URL) {
    while (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      mutate(url.href);
      url.pathname = url.pathname.split("/").slice(0, -2).join("/") + "/";
    }
  }

  return {
    get: function <T>(endpoint: string): T | undefined {
      const url = fullUrl(endpoint);
      const response = useSWR<T>(url.href, fetcher);
      return response.data;
    },

    post: async function <T>(endpoint: string, body: any = {}): Promise<T> {
      const headers: HeadersInit = { Accept: "application/json" };
      if (!(body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(body);
      }
      const url = fullUrl(endpoint);
      const response = await fetch(url.href, {
        method: "POST",
        headers: headers,
        body: body,
      });
      handleMutate(url);
      return response.json() as T;
    },

    delete: async function delete_(endpoint: string): Promise<void> {
      const url = fullUrl(endpoint);
      await fetch(url.href, { method: "DELETE" });
      handleMutate(url);
    },
  };
}
