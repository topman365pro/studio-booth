export const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;
export const USERNAME_RULES = "Use 3–24 lowercase letters, numbers, or underscores.";

const INTERNAL_AUTH_DOMAIN = "users.studio-booth.vercel.app";

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function isValidUsername(username: string) {
  return USERNAME_PATTERN.test(username);
}

export function usernameToAuthEmail(username: string) {
  return `${normalizeUsername(username)}@${INTERNAL_AUTH_DOMAIN}`;
}
