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

  function noSlashUrl(endpoint: string): string {
    const url = new URL(endpoint, "http://127.0.0.1:8000");
    return url.href;
  }

  return {
    noSlashUrl,

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

export const doDownload = (
  theURL: string,
  targetName: string,
  optionsIn?: any,
  onProgress: (bytesRead: number) => void = (bytesRead) =>
    console.log(bytesRead)
) => {
  const options = typeof optionsIn !== "undefined" ? optionsIn : {};
  if (onProgress && onProgress !== null) {
    return fetch(theURL, options).then(async (response) => {
      const reader = response.body?.getReader();
      if (reader) {
        const chunks: Uint8Array[] = [];
        let receivedLength = 0;
        while (true) {
          // done is true for the last chunk
          // value is Uint8Array of the chunk bytes
          const { done, value } = await reader.read();
          if (value) chunks.push(value);
          if (done) {
            break;
          }
          receivedLength += value.length;
          if (onProgress) onProgress(receivedLength);
        }
        let Uint8Chunks = new Uint8Array(receivedLength),
          position = 0;
        for (let chunk of chunks) {
          Uint8Chunks.set(chunk, position);
          position += chunk.length;
        }

        // ==> you may want to get the mimetype from the content-type header
        const blob = new Blob([Uint8Chunks]);

        // Create blob link to download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", targetName);

        // Append to html link element page
        document.body.appendChild(link);

        // Start download
        link.click();

        // Clean up and remove the link
        link.parentNode?.removeChild(link);
      }
    });
  }
};

export const doRetrieve = async (
  theURL: string,
  targetName: string,
  optionsIn?: any
) => {
  const options = typeof optionsIn !== "undefined" ? optionsIn : {};
  const response = await fetch(theURL, options);
  const contents = await response.arrayBuffer();
  return contents;
};
