import {
  InvalidSignedRequestError,
  verifyMetaSignedRequest,
} from './meta-signed-request';
import { createMetaSignedRequest } from './meta-signed-request.test-utils';

describe('verifyMetaSignedRequest', () => {
  it('accepts a request signed with the first secret', () => {
    const signedRequest = createMetaSignedRequest('instagram-user', 'first');

    expect(verifyMetaSignedRequest(signedRequest, ['first', 'second'])).toEqual(
      expect.objectContaining({
        secretIndex: 0,
        payload: expect.objectContaining({ user_id: 'instagram-user' }),
      }),
    );
  });

  it('accepts a request signed with the second secret', () => {
    const signedRequest = createMetaSignedRequest('instagram-user', 'second');

    expect(verifyMetaSignedRequest(signedRequest, ['first', 'second'])).toEqual(
      expect.objectContaining({ secretIndex: 1 }),
    );
  });

  it('rejects a tampered payload', () => {
    const signedRequest = createMetaSignedRequest('instagram-user', 'secret');
    const [, encodedPayload] = signedRequest.split('.');
    const tamperedPayload = Buffer.from(
      JSON.stringify({
        algorithm: 'HMAC-SHA256',
        issued_at: 1,
        user_id: 'different-user',
      }),
    ).toString('base64url');

    expect(() =>
      verifyMetaSignedRequest(
        `${signedRequest.split('.')[0]}.${tamperedPayload}`,
        ['secret'],
      ),
    ).toThrow(InvalidSignedRequestError);
    expect(encodedPayload).not.toBe(tamperedPayload);
  });

  it('rejects a request signed with the wrong secret', () => {
    const signedRequest = createMetaSignedRequest('instagram-user', 'secret');

    expect(() => verifyMetaSignedRequest(signedRequest, ['wrong'])).toThrow(
      InvalidSignedRequestError,
    );
  });

  it.each([
    undefined,
    'not-a-signed-request',
    'one.two.three',
    'not-base64.!!!',
    'not-base64.eyJub3QiOiJqc29u',
  ])('rejects malformed input: %s', (signedRequest) => {
    expect(() => verifyMetaSignedRequest(signedRequest, ['secret'])).toThrow(
      InvalidSignedRequestError,
    );
  });

  it('rejects an algorithm other than HMAC-SHA256', () => {
    const signedRequest = createMetaSignedRequest('instagram-user', 'secret', {
      algorithm: 'HMAC-SHA1',
    });

    expect(() => verifyMetaSignedRequest(signedRequest, ['secret'])).toThrow(
      InvalidSignedRequestError,
    );
  });

  it('rejects a payload without a user_id', () => {
    const signedRequest = createMetaSignedRequest(undefined, 'secret');

    expect(() => verifyMetaSignedRequest(signedRequest, ['secret'])).toThrow(
      InvalidSignedRequestError,
    );
  });

  it('coerces a numeric user_id to a string', () => {
    const signedRequest = createMetaSignedRequest(12345, 'secret');

    expect(
      verifyMetaSignedRequest(signedRequest, ['secret']).payload.user_id,
    ).toBe('12345');
  });

  it('skips empty secrets', () => {
    const signedRequest = createMetaSignedRequest('instagram-user', 'secret');

    expect(
      verifyMetaSignedRequest(signedRequest, ['', 'secret']).secretIndex,
    ).toBe(1);
  });
});
