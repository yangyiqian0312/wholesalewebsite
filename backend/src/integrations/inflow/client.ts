import { config } from "../../config.js";

type QueryValue = string | number | boolean | undefined;
type InflowRequestOptions = {
  method?: "GET" | "PUT" | "POST" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
};

const INFLOW_REQUEST_TIMEOUT_MS = 15000;

function buildQueryString(query: Record<string, QueryValue>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const result = searchParams.toString();
  return result ? `?${result}` : "";
}

export async function inflowRequest<T>(
  path: string,
  query: Record<string, QueryValue> = {},
  options: InflowRequestOptions = {},
): Promise<T> {
  const url = `${config.INFLOW_BASE_URL}/${config.INFLOW_COMPANY_ID}${path}${buildQueryString(query)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), INFLOW_REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json;version=2026-02-24",
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.INFLOW_API_KEY}`,
        ...options.headers,
      },
      signal: controller.signal,
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Inflow request timed out after ${INFLOW_REQUEST_TIMEOUT_MS / 1000} seconds: ${path}`);
    }

    throw error;
  }

  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Inflow request failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as T;
}
