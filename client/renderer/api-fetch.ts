/**
 * Centralized API fetching utilities
 * All fetch() calls should go through these functions to enable:
 * - Consistent error handling
 * - Authentication token injection
 * - Request/response logging
 * - Retry logic
 */

// Re-export the existing makeApiUrl helper
export { makeApiUrl } from "./api";

/**
 * Configuration for API requests
 */
interface ApiFetchConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ApiFetchConfig = {
  timeout: 30000,
  retries: 1,
};

/**
 * Core fetch wrapper with error handling and timeout
 */
async function coreFetch(
  url: string,
  options: RequestInit = {},
  config: ApiFetchConfig = {}
): Promise<Response> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Set up request options
  const requestOptions: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...finalConfig.headers,
      ...options.headers,
    },
  };

  // Add timeout if specified
  if (finalConfig.timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);
    requestOptions.signal = controller.signal;

    try {
      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  return fetch(url, requestOptions);
}

/**
 * Generic fetch that returns the Response object
 * Use this when you need access to headers, status codes, etc.
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {},
  config: ApiFetchConfig = {}
): Promise<Response> {
  try {
    const response = await coreFetch(url, options, config);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error(`API fetch failed for ${url}:`, error);
    throw error;
  }
}

/**
 * Fetch and return JSON data
 * Most common use case for API calls
 */
export async function apiJson<T = any>(
  url: string,
  options: RequestInit = {},
  config: ApiFetchConfig = {}
): Promise<T> {
  const response = await apiFetch(url, options, config);
  return response.json();
}

/**
 * Fetch and return text data
 * Useful for XML, CSV, or other text-based responses
 */
export async function apiText(
  url: string,
  options: RequestInit = {},
  config: ApiFetchConfig = {}
): Promise<string> {
  const response = await apiFetch(url, options, config);
  return response.text();
}

/**
 * Fetch and return blob data
 * Useful for file downloads
 */
export async function apiBlob(
  url: string,
  options: RequestInit = {},
  config: ApiFetchConfig = {}
): Promise<Blob> {
  const response = await apiFetch(url, options, config);
  return response.blob();
}

/**
 * Fetch and return array buffer data
 * Useful for binary file processing
 */
export async function apiArrayBuffer(
  url: string,
  options: RequestInit = {},
  config: ApiFetchConfig = {}
): Promise<ArrayBuffer> {
  const response = await apiFetch(url, options, config);
  return response.arrayBuffer();
}

/**
 * POST request with JSON payload
 */
export async function apiPost<T = any>(
  url: string,
  data: any,
  config: ApiFetchConfig = {}
): Promise<T> {
  return apiJson<T>(
    url,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    config
  );
}

/**
 * PUT request with JSON payload
 */
export async function apiPut<T = any>(
  url: string,
  data: any,
  config: ApiFetchConfig = {}
): Promise<T> {
  return apiJson<T>(
    url,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
    config
  );
}

/**
 * DELETE request
 */
export async function apiDelete<T = any>(
  url: string,
  config: ApiFetchConfig = {}
): Promise<T> {
  return apiJson<T>(
    url,
    {
      method: "DELETE",
    },
    config
  );
}

/**
 * GET request for JSON data (convenience method)
 */
export async function apiGet<T = any>(
  url: string,
  config: ApiFetchConfig = {}
): Promise<T> {
  return apiJson<T>(url, {}, config);
}

/**
 * Upload file with multipart/form-data
 */
export async function apiUpload<T = any>(
  url: string,
  file: File | FormData,
  config: ApiFetchConfig = {}
): Promise<T> {
  const formData = file instanceof FormData ? file : new FormData();
  if (file instanceof File) {
    formData.append("file", file);
  }

  // Don't set Content-Type for FormData, let browser set it with boundary
  const headers = { ...config.headers };
  delete headers["Content-Type"];

  return apiJson<T>(
    url,
    {
      method: "POST",
      body: formData,
    },
    {
      ...config,
      headers,
    }
  );
}

/**
 * Helper for SWR fetcher functions
 * Usage: const { data, error } = useSWR('/api/endpoint', swrFetcher);
 */
export const swrFetcher = (url: string) => apiJson(url);

/**
 * Helper for creating SWR fetcher with POST data
 */
export const swrPostFetcher = (data: any) => (url: string) =>
  apiPost(url, data);
