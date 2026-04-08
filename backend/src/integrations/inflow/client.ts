import { config } from "../../config.js";

type QueryValue = string | number | boolean | undefined;
type InflowRequestOptions = {
  method?: "GET" | "PUT" | "POST" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
};

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

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json;version=2026-02-24",
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.INFLOW_API_KEY}`,
      ...options.headers,
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Inflow request failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as T;
}
