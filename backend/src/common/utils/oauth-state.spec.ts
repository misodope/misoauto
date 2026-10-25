import {
  createDevelopmentOAuthState,
  parseDevelopmentOAuthState,
} from './oauth-state';

describe('oauth-state', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.OAUTH_STATE_SECRET = 'test-secret';
  });

  afterEach(() => {
    delete process.env.OAUTH_STATE_SECRET;
  });

  it('signs and verifies development state without exposing a mutable user ID', () => {
    const state = createDevelopmentOAuthState(42);

    expect(parseDevelopmentOAuthState(state)).toBe(42);
    expect(parseDevelopmentOAuthState(`${state}:tampered`)).toBeUndefined();
    expect(
      parseDevelopmentOAuthState(state.replace(':42:', ':99:')),
    ).toBeUndefined();
  });

  it('rejects malformed state', () => {
    expect(parseDevelopmentOAuthState(undefined)).toBeUndefined();
    expect(parseDevelopmentOAuthState('csrf:42')).toBeUndefined();
    expect(
      parseDevelopmentOAuthState('csrf:not-a-number:signature'),
    ).toBeUndefined();
  });
});
