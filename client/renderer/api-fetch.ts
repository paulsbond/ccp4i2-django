/**
 * Centralized API fetcher that can be configured for authentication
 * All API calls should go through this function
 */

const REQUIRE_AUTH = process.env.NEXT_PUBLIC_REQUIRE_AUTH === "true";

/**
 * Central API fetch function - single point for all API calls
 * Can be enhanced with authentication, logging, error handling, etc.
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Default headers
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Merge headers
  const headers = {
    ...defaultHeaders,
    ...options.headers,
  };

  // For now, just use regular fetch
  // TODO: Add authentication logic here when ready
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Convenience wrapper for JSON responses
 */
export async function apiJson<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await apiFetch(url, options);

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Convenience wrapper for text responses
 */
export async function apiText(
  url: string,
  options: RequestInit = {}
): Promise<string> {
  const response = await apiFetch(url, options);

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.text();
}
