import { createHmac, timingSafeEqual } from 'node:crypto';

export interface MetaSignedRequestPayload {
  algorithm: string;
  issued_at: number;
  expires?: number;
  user_id: string;
}

export class InvalidSignedRequestError extends Error {}

const decode = (value: string): Buffer =>
  Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

/**
 * Verifies a Meta `signed_request` (HMAC-SHA256 over the encoded payload)
 * against each candidate secret. Returns the payload and the index of the
 * secret that matched; throws InvalidSignedRequestError otherwise.
 */
export function verifyMetaSignedRequest(
  signedRequest: string | undefined,
  secrets: string[],
): { payload: MetaSignedRequestPayload; secretIndex: number } {
  const parts = (signedRequest ?? '').split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new InvalidSignedRequestError('Malformed signed_request');
  }

  const [encodedSig, encodedPayload] = parts;

  let payload: MetaSignedRequestPayload;
  try {
    payload = JSON.parse(decode(encodedPayload).toString('utf8'));
  } catch {
    throw new InvalidSignedRequestError('Unreadable payload');
  }

  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.algorithm !== 'string' ||
    payload.algorithm.toUpperCase() !== 'HMAC-SHA256'
  ) {
    throw new InvalidSignedRequestError('Unsupported algorithm');
  }
  if (
    (typeof payload.user_id !== 'string' &&
      typeof payload.user_id !== 'number') ||
    payload.user_id === ''
  ) {
    throw new InvalidSignedRequestError('Missing user_id');
  }

  const signature = decode(encodedSig);
  const secretIndex = secrets.findIndex((secret) => {
    if (!secret) return false;

    const expected = createHmac('sha256', secret)
      .update(encodedPayload)
      .digest();

    return (
      expected.length === signature.length &&
      timingSafeEqual(expected, signature)
    );
  });

  if (secretIndex === -1) {
    throw new InvalidSignedRequestError('Signature mismatch');
  }

  return {
    payload: { ...payload, user_id: String(payload.user_id) },
    secretIndex,
  };
}
