import useSWR from "swr";
import $ from "jquery";

const validation_fetcher = (url: string) => {
  return fetch(url)
    .then((r) => r.json())
    .then((r1) =>
      Promise.resolve(
        r1?.status === "Success" ? $.parseXML(r1.validation) : null
      )
    );
};

const container_fetcher = (url: string) => {
  return fetch(url)
    .then((r) => r.json())
    .then((r1) => Promise.resolve(JSON.parse(r1.container)));
};

const digest_fetcher = (url: string) => {
  return fetch(url).then((r) => r.json());
};

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

    follow: function <T>(endpoint: string) {
      return useSWR<T>(fullUrl(endpoint), fetcher, { refreshInterval: 5000 });
    },

    container: function <T>(endpoint: string) {
      return useSWR<T>(fullUrl(endpoint), container_fetcher);
    },

    digest: function <T>(endpoint: string) {
      return useSWR<T>(fullUrl(endpoint), digest_fetcher);
    },

    validation: function <T>(endpoint: string) {
      return useSWR<any>(fullUrl(endpoint), validation_fetcher);
    },

    post: async function <T>(endpoint: string, body: any = {}): Promise<T> {
      const headers: HeadersInit = { Accept: "application/json" };
      if (body instanceof FormData) {
        //headers["Content-Type"] = "multipart/form-data";
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(body);
      }
      console.log(headers);
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
