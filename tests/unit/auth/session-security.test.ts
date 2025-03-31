import { jest } from '@jest/globals';

// Mock process.env.NODE_ENV
jest.replaceProperty(process.env, 'NODE_ENV', 'test');

// Mock the Node.js Crypto module if needed
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => Buffer.from('test-random')),
}));

import {
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from '../../../tests/mocks/lib/auth/session';

describe('Session Cookie Security', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    // Restore NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      configurable: true,
    });
  });

  it('should use secure cookies in production environment', () => {
    // Set to production
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    });

    const options = getSessionCookieOptions();
    expect(options.secure).toBe(true);
  });

  it('should use non-secure cookies in development environment', () => {
    // Set to development
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true,
    });

    const options = getSessionCookieOptions();
    expect(options.secure).toBe(false);
  });

  it('should always set httpOnly flag', () => {
    const options = getSessionCookieOptions();
    expect(options.httpOnly).toBe(true);
  });

  it('should set the path to root', () => {
    const options = getSessionCookieOptions();
    expect(options.path).toBe('/');
  });

  it('should use a secure cookie name', () => {
    // Cookie name should not reveal too much about implementation
    expect(SESSION_COOKIE_NAME).toBe('session');
  });

  it('should use SameSite=Lax to prevent CSRF', () => {
    const options = getSessionCookieOptions();
    expect(options.sameSite).toBe('lax');
  });
});
