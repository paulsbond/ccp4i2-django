import useSWR from "swr";
import $ from "jquery";
import { prettifyXml } from "./utils";

export function fullUrl(endpoint: string): string {
  let api_path = `/api/proxy/${endpoint}`;
  if (api_path.charAt(api_path.length - 1) !== "/") api_path += "/";
  return api_path;
}

export interface EndpointFetch {
  type: string;
  id: number | null | undefined;
  endpoint: string;
}

const endpoint_xml_fetcher = (endpointFetch: EndpointFetch) => {
  if (!endpointFetch.id) return Promise.reject();
  const url = fullUrl(
    `${endpointFetch.type}/${endpointFetch.id}/${endpointFetch.endpoint}`
  );
  return fetch(url)
    .then((r) => r.json())
    .then((r1) =>
      Promise.resolve(r1?.status === "Success" ? $.parseXML(r1.xml) : null)
    );
};

const endpoint_validation_fetcher = (endpointFetch: EndpointFetch) => {
  if (!endpointFetch.id) return Promise.reject();
  const url = fullUrl(
    `${endpointFetch.type}/${endpointFetch.id}/${endpointFetch.endpoint}`
  );
  return fetch(url)
    .then((r) => r.json())
    .then((r1) => {
      const validationXml = $.parseXML(r1.xml);
      const objectPaths = $(validationXml).find("objectPath").toArray();
      const results: any = {};
      objectPaths.forEach((errorObjectNode: HTMLElement) => {
        const objectPath = errorObjectNode.textContent?.trim();
        if (objectPath && objectPath.length > 0) {
          let objectErrors: { messages: string[]; maxSeverity: number };
          if (!Object.keys(results).includes(objectPath)) {
            results[objectPath] = { messages: [], maxSeverity: 0 };
          }
          objectErrors = results[objectPath];
          const errorNode = $(errorObjectNode).parent();
          if (errorNode) {
            const severity = $(errorNode).find("severity").get(0)?.textContent;
            if (severity?.includes("WARNING") && objectErrors.maxSeverity < 1)
              objectErrors.maxSeverity = 1;
            if (severity?.includes("ERROR") && objectErrors.maxSeverity < 2)
              objectErrors.maxSeverity = 2;
            const description = $(errorNode)
              .find("description")
              .get(0)?.textContent;
            if (description) objectErrors.messages.push(description);
          }
        }
      });
      return Promise.resolve(results);
    });
};

const pretty_endpoint_xml_fetcher = (endpointFetch: EndpointFetch) => {
  if (!endpointFetch.id) return Promise.reject();
  const url = fullUrl(
    `${endpointFetch.type}/${endpointFetch.id}/${endpointFetch.endpoint}`
  );
  return fetch(url)
    .then((r) => r.json())
    .then((r1) =>
      Promise.resolve(
        r1?.status === "Success" ? prettifyXml($.parseXML(r1.xml)) : null
      )
    );
};

const endpoint_wrapped_json_fetcher = (endpointFetch: EndpointFetch) => {
  if (!endpointFetch.id) return Promise.reject();
  const url = fullUrl(
    `${endpointFetch.type}/${endpointFetch.id}/${endpointFetch.endpoint}`
  );
  return fetch(url)
    .then((r) => r.json())
    .then((r) => {
      const result = JSON.parse(r.result);
      if (endpointFetch.endpoint === "container") {
        const lookup = buildLookup(result);
        return Promise.resolve({ container: result, lookup });
      }
      return result;
    });
};

const buildLookup = (container: any, lookup_in?: any): any => {
  const lookup = lookup_in ? lookup_in : {};
  const objectPath = container._objectPath;
  const pathElements = objectPath.split(".");
  for (let i = 0; i < pathElements.length; i++) {
    const subPath = pathElements.slice(-i).join(".");
    lookup[subPath] = container;
  }
  if (container._baseClass === "CList") {
    container._value.forEach((item: any) => {
      buildLookup(item, lookup);
    });
  } else if (container._value?.constructor == Object) {
    Object.keys(container._value).forEach((key: string) => {
      const item = container._value[key];
      buildLookup(item, lookup);
    });
  }
  return lookup;
};

const endpoint_fetcher = (endpointFetch: EndpointFetch) => {
  if (!endpointFetch.id) return Promise.reject();
  const url = fullUrl(
    `${endpointFetch.type}/${endpointFetch.id}/${endpointFetch.endpoint}`
  );
  return fetch(url).then((r) => r.json());
};

const digest_fetcher = (url: string) => {
  return fetch(url).then((r) => {
    //console.log(r);
    return r.json();
  });
};

export function useApi() {
  const fetcher = (url: string) => fetch(url).then((r) => r.json());

  function noSlashUrl(endpoint: string): string {
    let api_path = `/api/proxy/${endpoint}`;
    return api_path;
  }

  return {
    noSlashUrl,

    get: function <T>(endpoint: string, refreshInterval: number = 0) {
      return useSWR<T>(fullUrl(endpoint), fetcher, { refreshInterval });
    },

    config: function <T>() {
      return useSWR<T>("config", () => {
        return fetch("/api/config").then((r) => r.json());
      });
    },

    get_endpoint: function <T>(
      endpointFetch: EndpointFetch,
      refreshInterval: number = 0
    ) {
      return useSWR<T>(endpointFetch, endpoint_fetcher as any, {
        refreshInterval,
      });
    },

    get_endpoint_xml: function <XMLDocument>(
      endpointFetch: EndpointFetch,
      refreshInterval: number = 0
    ) {
      return useSWR(endpointFetch, endpoint_xml_fetcher, { refreshInterval });
    },

    get_pretty_endpoint_xml: function (endpointFetch: EndpointFetch) {
      return useSWR(endpointFetch, pretty_endpoint_xml_fetcher);
    },

    get_wrapped_endpoint_json: function <T>(endpointFetch: EndpointFetch) {
      return useSWR<T>(endpointFetch, endpoint_wrapped_json_fetcher, {});
    },

    get_validation: function (endpointFetch: EndpointFetch) {
      return useSWR(endpointFetch, endpoint_validation_fetcher, {});
    },

    digest: function <T>(endpoint: string) {
      //console.log(endpoint);
      const result = useSWR<T>(fullUrl(endpoint), digest_fetcher);
      //console.log(result.data);
      return result;
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
      if (!response.ok) {
        const errorText = await response.text(); // Or `res.json()` if the response is JSON
        throw new Error(`Failed to fetch: ${response.status} - ${errorText}`);
      }
      return response.json() as Promise<T>;
    },

    postNoSlash: async function <T>(
      endpoint: string,
      body: any = {}
    ): Promise<T> {
      const headers: HeadersInit = { Accept: "application/json" };
      if (body instanceof FormData) {
        //headers["Content-Type"] = "multipart/form-data";
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(body);
      }
      const response = await fetch(noSlashUrl(endpoint), {
        method: "POST",
        headers: headers,
        body: body,
      });
      return response.json() as Promise<T>;
    },

    delete: async function (endpoint: string): Promise<void> {
      const result = await fetch(fullUrl(endpoint), { method: "DELETE" });
      //console.log(result);
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
        const url = URL.createObjectURL(blob);
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
