import { createHmac } from 'node:crypto';

export const createMetaSignedRequest = (
  userId: string | number | undefined,
  secret: string,
  overrides: Record<string, unknown> = {},
): string => {
  const payload = {
    algorithm: 'HMAC-SHA256',
    issued_at: Math.floor(Date.now() / 1000),
    ...(userId === undefined ? {} : { user_id: userId }),
    ...overrides,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    'base64url',
  );
  const encodedSignature = createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedSignature}.${encodedPayload}`;
};
