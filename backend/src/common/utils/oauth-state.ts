import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const DEVELOPMENT_SECRET = 'misoauto-development-oauth-state-secret';

const getOAuthStateSecret = (): string => {
  const secret = process.env.OAUTH_STATE_SECRET || process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('OAUTH_STATE_SECRET or JWT_SECRET must be configured');
  }
  return secret || DEVELOPMENT_SECRET;
};

export const createOAuthNonce = (): string => randomBytes(32).toString('hex');

export const createDevelopmentOAuthState = (userId: number): string => {
  const nonce = createOAuthNonce();
  const payload = `${nonce}:${userId}`;
  const signature = createHmac('sha256', getOAuthStateSecret())
    .update(payload)
    .digest('hex');
  return `${payload}:${signature}`;
};

export const parseDevelopmentOAuthState = (
  state: string | undefined,
): number | undefined => {
  if (!state) return undefined;

  const parts = state.split(':');
  if (parts.length !== 3) return undefined;

  const [nonce, userIdValue, signature] = parts;
  const payload = `${nonce}:${userIdValue}`;
  const expected = createHmac('sha256', getOAuthStateSecret())
    .update(payload)
    .digest('hex');

  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return undefined;
  }

  const userId = Number(userIdValue);
  return Number.isSafeInteger(userId) && userId > 0 ? userId : undefined;
};
