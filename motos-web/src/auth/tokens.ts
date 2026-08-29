let accessToken: string | null = null;
let refreshToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

const ACCESS_KEY = "monarca.accessToken";
const REFRESH_KEY = "monarca.refreshToken";

export function loadStoredTokens() {
  accessToken = sessionStorage.getItem(ACCESS_KEY);
  refreshToken = localStorage.getItem(REFRESH_KEY);
}

export function setAuthTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  sessionStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearAuthTokens() {
  accessToken = null;
  refreshToken = null;
  sessionStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export function notifyUnauthorized() {
  onUnauthorized?.();
}

loadStoredTokens();
