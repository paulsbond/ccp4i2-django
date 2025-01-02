import useSWR from "swr";

export function useApi() {
  const fetcher = (url: string) => fetch(url).then((r) => r.json());

  function fullUrl(endpoint: string): string {
    const url = new URL(endpoint, "http://127.0.0.1:8000");
    if (url.pathname.charAt(url.pathname.length - 1) !== "/")
      url.pathname += "/";
    return url.href;
  }

  return {
    get: function <T>(endpoint: string) {
      return useSWR<T>(fullUrl(endpoint), fetcher);
    },

    post: async function <T>(endpoint: string, body: any = {}): Promise<T> {
      const headers: HeadersInit = { Accept: "application/json" };
      if (!(body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(body);
      }
      const response = await fetch(fullUrl(endpoint), {
        method: "POST",
        headers: headers,
        body: body,
      });
      return response.json() as Promise<T>;
    },

    delete: async function (endpoint: string): Promise<void> {
      await fetch(fullUrl(endpoint), { method: "DELETE" });
    },

    patch: async function <T>(endpoint: string, body: any = {}): Promise<T> {
      const headers: HeadersInit = { Accept: "application/json" };
      if (!(body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(body);
      }
      const response = await fetch(fullUrl(endpoint), {
        method: "PATCH",
        headers: headers,
        body: body,
      });
      return response.json() as Promise<T>;
    },
  };
}
