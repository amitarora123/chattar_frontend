const REFRESH_TOKEN_KEY = "refreshToken";
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export const setRefreshToken = (token: string): void => {
  if (!token || token === "undefined" || token === "null") return;
  document.cookie = [
    `${REFRESH_TOKEN_KEY}=${token}`,
    "path=/",
    `max-age=${REFRESH_TOKEN_MAX_AGE}`,
    "SameSite=Strict",
    ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
  ].join("; ");
};

export const getRefreshToken = (): string | null => {
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${REFRESH_TOKEN_KEY}=([^;]+)`),
  );
  const value = match?.[1] ?? null;
  if (!value || value === "undefined" || value === "null") return null;
  return value;
};

export const clearRefreshToken = (): void => {
  document.cookie = `${REFRESH_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
};
