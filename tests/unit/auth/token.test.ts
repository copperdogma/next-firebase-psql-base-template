import {
  shouldRefreshToken,
  refreshUserTokenAndSession,
} from '../../../tests/mocks/lib/auth/token';
import { User } from '@firebase/auth';
import { TOKEN_REFRESH_THRESHOLD_MS } from '../../../tests/mocks/lib/auth/token';

// Mock user
const mockUser = {
  getIdTokenResult: jest.fn().mockResolvedValue({
    expirationTime: new Date(Date.now() + 60 * 60 * 1000).getTime() / 1000, // 1 hour in the future
  }),
} as unknown as User;

describe('Token Refresh Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not refresh token for null user', () => {
    const shouldRefresh = shouldRefreshToken(null);
    expect(shouldRefresh).toBe(false);
  });

  it('should refresh user token and return value', async () => {
    const token = await refreshUserTokenAndSession(mockUser);
    expect(token).toBe('mock-refreshed-id-token');
  });

  it('should return null when refreshing token for null user', async () => {
    const token = await refreshUserTokenAndSession(null);
    expect(token).toBeNull();
  });
});
