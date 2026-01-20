/**
 * Check if we're using ngrok for cross-origin development
 */
export const isNgrokDev = (): boolean => !!process.env.NGROK_URL;

/**
 * Determine if cookies should use the secure flag
 * - Production: always secure
 * - ngrok dev: secure (ngrok uses HTTPS)
 * - Local dev: not secure
 */
export const useSecureCookies = (): boolean =>
  process.env.NODE_ENV === 'production' || isNgrokDev();

/**
 * Get the appropriate SameSite value for cookies
 * - ngrok dev: 'none' (required for cross-origin)
 * - Otherwise: 'strict' for auth, 'lax' for OAuth
 */
export const getCookieSameSite = (
  type: 'auth' | 'oauth' = 'auth',
): 'strict' | 'lax' | 'none' => {
  if (isNgrokDev()) {
    return 'none';
  }
  return type === 'auth' ? 'strict' : 'lax';
};

type CookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
};

/**
 * Get standard cookie options for OAuth flows
 */
export const getOAuthCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: useSecureCookies(),
  sameSite: getCookieSameSite('oauth'),
});

/**
 * Get standard cookie options for auth (refresh token)
 */
export const getAuthCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: useSecureCookies(),
  sameSite: getCookieSameSite('auth'),
});
