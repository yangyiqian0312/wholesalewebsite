const backendBaseUrl = process.env.CATALOG_BACKEND_URL ?? "http://127.0.0.1:4000";
const frontendBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wholesale.crossingcards.com";

export function getBackendBaseUrl() {
  return backendBaseUrl;
}

export function getFrontendBaseUrl() {
  return frontendBaseUrl;
}

export function getAdminApiToken() {
  const token = process.env.ADMIN_API_TOKEN;

  if (!token) {
    throw new Error("ADMIN_API_TOKEN is not configured");
  }

  return token;
}
