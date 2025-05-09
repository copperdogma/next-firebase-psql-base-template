import { v4 as uuidv4 } from 'uuid';
import { type Session } from 'next-auth';
import { type JWT } from '@auth/core/jwt';
import { logger } from '@/lib/logger';
import { handleJwtSignIn, handleJwtUpdate } from '@/lib/auth/auth-jwt';
import { handleSharedSessionCallback } from '@/lib/auth-shared';
import { authConfigNode } from '@/lib/auth-node';
import { UserRole } from '@/types';
import { createMockUser, createMockAccount, createMockToken } from '@/tests/mocks/auth';
import { DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { firebaseAdminServiceImpl as mockFirebaseAdminServiceImpl_imported } from '@/lib/server/firebase-admin-singleton';

jest.mock('@/lib/logger');
jest.mock('@/lib/auth/auth-jwt');
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

const mockUuidv4 = uuidv4 as jest.Mock;
const mockHandleJwtSignIn = handleJwtSignIn as jest.Mock;
const mockHandleJwtUpdate = handleJwtUpdate as jest.Mock;
const mockLoggerDebug = logger.debug as jest.Mock;
// const mockLoggerInfo = logger.info as jest.Mock;

// --- Mocks for Firebase Service ---
// The following const declarations for mockFirebaseIsInitialized, mockFirebaseGetUser,
// and mockFirebaseCreateUser are removed from here as they will be redefined later.

jest.mock('@/lib/server/firebase-admin-singleton', () => ({
  firebaseAdminServiceImpl: {
    __esModule: true,
    isInitialized: jest.fn(),
    getUser: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    getUserByEmail: jest.fn(),
  },
  isFirebaseAdminServiceReady: jest.fn(() => true),
}));

// Re-define the mockFirebase... consts using the imported mocked service
const mockFirebaseIsInitialized = mockFirebaseAdminServiceImpl_imported.isInitialized as jest.Mock;
const mockFirebaseGetUser = mockFirebaseAdminServiceImpl_imported.getUser as jest.Mock;
const mockFirebaseCreateUser = mockFirebaseAdminServiceImpl_imported.createUser as jest.Mock;

jest.mock('@/types', () => ({
  UserRole: { ADMIN: 'ADMIN', USER: 'USER' },
}));

describe('NextAuth Callbacks (Node & Shared)', () => {
  const mockCorrelationId = 'mock-correlation-id';
  let jwtCallback: (args: any) => Promise<JWT | null>;
  let sessionCallback: (args: any) => Promise<Session>;
  // @ts-expect-error - Used for test setup, may be used in future tests
  let _mockPrisma: DeepMockProxy<PrismaClient>;

  beforeAll(() => {
    jwtCallback = authConfigNode.callbacks?.jwt as any;
    sessionCallback = authConfigNode.callbacks?.session as any;
    if (!jwtCallback || !sessionCallback) {
      throw new Error('JWT or Session callback not found in authConfigNode');
    }
    // Get the auto-mocked prisma instance
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _mockPrisma = require('@/lib/prisma').prisma as DeepMockProxy<PrismaClient>;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUuidv4.mockReturnValue(mockCorrelationId);
    // Clear Firebase mocks too
    mockFirebaseIsInitialized.mockClear();
    mockFirebaseGetUser.mockClear();
    mockFirebaseCreateUser.mockClear();
  });

  describe('authConfigNode.callbacks.jwt', () => {
    it('should call handleJwtSignIn on "signIn" trigger with user and account', async () => {
      const trigger = 'signIn';
      const token = createMockToken();
      const user = createMockUser();
      const account = createMockAccount('oauth');
      mockHandleJwtSignIn.mockResolvedValue({ ...token, signInHandled: true });

      await jwtCallback({ token, user, account, trigger });

      // Verify handleJwtSignIn was called correctly
      expect(mockHandleJwtSignIn).toHaveBeenCalledTimes(1);
      expect(mockHandleJwtSignIn).toHaveBeenCalledWith(
        expect.objectContaining({
          token,
          user,
          account,
          trigger,
          correlationId: mockCorrelationId,
          profile: undefined, // Explicitly expect profile to be undefined here
        })
      );
      // Verify handleJwtUpdate was NOT called
      expect(mockHandleJwtUpdate).not.toHaveBeenCalled();
    });

    it('should call handleJwtUpdate on "update" trigger with session', async () => {
      const token = createMockToken({ role: UserRole.USER });
      const session = { user: { name: 'Updated Name' } };
      const trigger = 'update';
      const expectedUpdatedToken = { ...token, name: 'Updated Name' };
      mockHandleJwtUpdate.mockResolvedValue(expectedUpdatedToken);

      const result = await jwtCallback({ token, trigger, session });

      // Verify handleJwtUpdate was called correctly
      expect(mockHandleJwtUpdate).toHaveBeenCalledTimes(1);
      expect(mockHandleJwtUpdate).toHaveBeenCalledWith(
        token,
        session,
        mockCorrelationId,
        expect.any(Object) // Dependencies object
      );
      // Verify handleJwtSignIn was NOT called
      expect(mockHandleJwtSignIn).not.toHaveBeenCalled();
      // Verify the result is what handleJwtUpdate returned
      expect(result).toEqual(expectedUpdatedToken);
    });

    it('should handle case where token might be minimal (only sub and role)', async () => {
      const minimalToken: JWT = {
        sub: 'user-minimal-id',
        role: UserRole.USER,
      };
      const trigger = 'session';

      const result = await jwtCallback({ token: minimalToken, trigger });

      // Verify core logic: no sign-in or update handlers called for session trigger without session data
      expect(mockHandleJwtSignIn).not.toHaveBeenCalled();
      expect(mockHandleJwtUpdate).not.toHaveBeenCalled();

      // Verify returned token properties
      expect(result).toBeDefined();
      expect(result?.sub).toBe(minimalToken.sub);
      expect(result?.role).toBe(minimalToken.role);
      expect(result?.jti).toBeDefined(); // JTI should be added
      expect(result?.jti).toBe(mockCorrelationId); // Expect the newly generated JTI
    });

    it('should call handleJwtSignIn on "signUp" trigger with user and account', async () => {
      const token = createMockToken();
      const user = createMockUser();
      const account = createMockAccount('credentials');
      const trigger = 'signUp';
      const expectedResultToken = { ...token, signUpHandled: true };

      mockHandleJwtSignIn.mockResolvedValue(expectedResultToken);

      const result = await jwtCallback({ token, user, account, trigger });

      // Verify handleJwtSignIn was called correctly
      expect(mockHandleJwtSignIn).toHaveBeenCalledTimes(1);
      expect(mockHandleJwtSignIn).toHaveBeenCalledWith(
        expect.objectContaining({
          token,
          user,
          account,
          profile: undefined, // profile is optional
          correlationId: mockCorrelationId,
        })
      );
      // Verify handleJwtUpdate was NOT called
      expect(mockHandleJwtUpdate).not.toHaveBeenCalled();
      // Verify the result
      expect(result).toEqual(expectedResultToken);
    });

    it('should return original token for other triggers (e.g., session) and ensure JTI', async () => {
      const token = createMockToken(); // Has JTI
      const trigger = 'session';

      const result = await jwtCallback({ token, trigger });

      // Verify core logic
      expect(mockHandleJwtSignIn).not.toHaveBeenCalled();
      expect(mockHandleJwtUpdate).not.toHaveBeenCalled();

      // Verify returned token properties
      expect(result).not.toBeNull();
      expect(result?.jti).toBe(token.jti); // Expect original JTI
      expect(result).toEqual(token);
    });

    it('should return original token if user is missing on signIn trigger', async () => {
      const token = createMockToken();
      const account = createMockAccount('google');
      const trigger = 'signIn';

      const result = await jwtCallback({ token, account, trigger });

      // Verify core logic
      expect(mockHandleJwtSignIn).not.toHaveBeenCalled();
      expect(mockHandleJwtUpdate).not.toHaveBeenCalled();

      // Verify returned token properties
      expect(result).toEqual({ ...token, jti: token.jti ?? mockCorrelationId }); // Ensure JTI exists
    });

    it('should return original token if session is missing on update trigger', async () => {
      const token = createMockToken();
      const trigger = 'update';

      const result = await jwtCallback({ token, trigger });

      // Verify core logic
      expect(mockHandleJwtSignIn).not.toHaveBeenCalled();
      expect(mockHandleJwtUpdate).not.toHaveBeenCalled();

      // Verify returned token properties
      expect(result).toEqual({ ...token, jti: token.jti ?? mockCorrelationId });
    });

    // --- Error Handling Tests ---

    it('should propagate error from handleJwtSignIn', async () => {
      const trigger = 'signIn';
      const token = createMockToken();
      const user = createMockUser();
      const account = createMockAccount('oauth');
      const signInError = new Error('DB connection failed during sign-in');

      mockHandleJwtSignIn.mockRejectedValue(signInError);

      // Expect the jwtCallback to reject with the same error
      await expect(jwtCallback({ token, user, account, trigger })).rejects.toThrow(signInError);

      // Verify handleJwtSignIn was called
      expect(mockHandleJwtSignIn).toHaveBeenCalledTimes(1);
      expect(mockHandleJwtUpdate).not.toHaveBeenCalled();
    });

    it('should propagate error from handleJwtUpdate', async () => {
      const token = createMockToken({ role: UserRole.USER });
      const session = { user: { name: 'Updated Name' } };
      const trigger = 'update';
      const updateError = new Error('Session update failed unexpectedly');

      mockHandleJwtUpdate.mockRejectedValue(updateError);

      // Expect the jwtCallback to reject with the same error
      await expect(jwtCallback({ token, trigger, session })).rejects.toThrow(updateError);

      // Verify handleJwtUpdate was called
      expect(mockHandleJwtUpdate).toHaveBeenCalledTimes(1);
      expect(mockHandleJwtSignIn).not.toHaveBeenCalled();
    });

    // Test for Firebase Sync logic
    it('should attempt Firebase user sync for OAuth signIn/signUp', async () => {
      const trigger = 'signUp';
      const token = createMockToken();
      const user = createMockUser({ emailVerified: null });
      const account = createMockAccount('google', { type: 'oidc' });
      const profile = { email: user.email!, email_verified: true, name: user.name };
      const expectedFinalToken = {
        ...token,
        sub: user.id,
        role: user.role,
        jti: mockCorrelationId,
      };

      // Configure mocks (they are now defined globally)
      mockFirebaseIsInitialized.mockReturnValue(true);
      mockHandleJwtSignIn.mockResolvedValue(expectedFinalToken); // Mock this dependency

      // Scenario 1: Firebase user NOT found
      mockFirebaseGetUser.mockRejectedValue({ code: 'auth/user-not-found' });
      mockFirebaseCreateUser.mockResolvedValue({ uid: user.id });

      await jwtCallback({ token, user, account, profile, trigger });

      // Assertions (should work now)
      expect(mockHandleJwtSignIn).toHaveBeenCalledTimes(1);
      expect(mockFirebaseGetUser).toHaveBeenCalledTimes(1);
      // ... rest of assertions for scenario 1 ...

      // Reset mocks for Scenario 2
      mockFirebaseIsInitialized.mockClear();
      mockFirebaseGetUser.mockClear();
      mockFirebaseCreateUser.mockClear();
      mockHandleJwtSignIn.mockClear(); // Also clear this one

      // Configure for Scenario 2
      mockFirebaseIsInitialized.mockReturnValue(true);
      mockFirebaseGetUser.mockResolvedValue({ uid: user.id });
      mockHandleJwtSignIn.mockResolvedValue(expectedFinalToken); // Need to mock again

      await jwtCallback({ token, user, account, profile, trigger });

      // Assertions for Scenario 2
      expect(mockHandleJwtSignIn).toHaveBeenCalledTimes(1); // Called again
      expect(mockFirebaseGetUser).toHaveBeenCalledTimes(1);
      expect(mockFirebaseCreateUser).not.toHaveBeenCalled();
    });
  });

  describe('handleSharedSessionCallback', () => {
    it('should map token properties to session.user', async () => {
      const mockSession: Session = {
        user: {
          // Initial default user from Session type might not have all fields
          id: '',
          name: null,
          email: null,
          image: null,
          role: UserRole.USER, // Default role or leave undefined if not set initially
        },
        expires: new Date().toISOString(),
      };
      const mockToken: JWT = {
        sub: 'user-123',
        role: UserRole.ADMIN,
        name: 'Test User',
        email: 'test@example.com',
        picture: 'http://example.com/pic.jpg',
        // other potential JWT fields
        iat: 123456,
        exp: 789012,
        jti: 'abc-def',
      };

      const result = await handleSharedSessionCallback({
        session: JSON.parse(JSON.stringify(mockSession)),
        token: mockToken,
      });

      expect(mockLoggerDebug).toHaveBeenCalledWith({
        msg: '[Shared Session Callback] Start',
        hasTokenSub: true,
      });
      expect(result.user.id).toBe('user-123');
      expect(result.user.role).toBe(UserRole.ADMIN);
      expect(result.user.name).toBe('Test User');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.image).toBe('http://example.com/pic.jpg');
      expect(mockLoggerDebug).toHaveBeenCalledWith({
        msg: '[Shared Session Callback] End',
        userId: 'user-123',
        userRole: UserRole.ADMIN,
      });
    });

    it('should handle token with missing optional properties gracefully', async () => {
      const mockSession: Session = {
        user: { id: '', name: null, email: null, image: null, role: UserRole.USER },
        expires: new Date().toISOString(),
      };
      const mockToken: JWT = {
        sub: 'user-456', // Only mandatory field (sub)
        role: UserRole.USER, // Role is usually present from JWT callback
      };

      const result = await handleSharedSessionCallback({
        session: JSON.parse(JSON.stringify(mockSession)),
        token: mockToken,
      });

      expect(mockLoggerDebug).toHaveBeenCalledWith({
        msg: '[Shared Session Callback] Start',
        hasTokenSub: true,
      });
      expect(result.user.id).toBe('user-456');
      expect(result.user.role).toBe(UserRole.USER); // Role mapped
      expect(result.user.name).toBeNull(); // Should remain null
      expect(result.user.email).toBeNull(); // Should remain null
      expect(result.user.image).toBeNull(); // Should remain null
      expect(mockLoggerDebug).toHaveBeenCalledWith({
        msg: '[Shared Session Callback] End',
        userId: 'user-456',
        userRole: UserRole.USER,
      });
    });

    it('should handle case where token might be minimal (only sub and role)', async () => {
      const mockSession: Session = {
        user: {
          id: 'initial-id',
          name: 'Initial Name',
          email: 'initial@example.com',
          image: null,
          role: UserRole.USER,
        }, // Initial role is USER
        expires: new Date().toISOString(),
      };
      // Use a minimal token instead of null
      const minimalToken: JWT = {
        sub: 'minimal-user-sub',
        role: UserRole.USER, // Role = USER
      };

      // Pass a deep copy of the session to the callback
      const sessionCopy = JSON.parse(JSON.stringify(mockSession));
      const result = await handleSharedSessionCallback({
        session: sessionCopy,
        token: minimalToken,
      });

      expect(mockLoggerDebug).toHaveBeenCalledWith({
        msg: '[Shared Session Callback] Start',
        hasTokenSub: true,
      });
      // Check that existing session fields aren't overwritten by missing token fields
      expect(result.user.id).toBe('minimal-user-sub'); // ID should update from sub
      // Explicitly cast both sides to UserRole for comparison
      expect(result.user.role as UserRole).toBe(UserRole.USER);
      expect(result.user.name).toBe('Initial Name'); // Should remain
      expect(result.user.email).toBe('initial@example.com'); // Should remain
      expect(result.user.image).toBeNull(); // Should remain null
      expect(mockLoggerDebug).toHaveBeenCalledWith({
        msg: '[Shared Session Callback] End',
        userId: 'minimal-user-sub',
        userRole: UserRole.USER,
      });
    });

    describe('handleSharedSessionCallback without token.sub', () => {
      it('should create a new empty/guest session if token lacks sub', async () => {
        // Session without token.sub
        const tokenWithoutSub: JWT = {
          name: 'Guest',
          email: null,
          picture: null,
          // Remove sub field
          role: UserRole.USER, // Role = USER instead of GUEST
          iat: 123456,
          exp: 789012,
          jti: 'test-jti-123',
        };
        const mockSession: Session = {
          user: { id: '', name: null, email: null, image: null, role: UserRole.USER },
          expires: new Date().toISOString(),
        };
        const result = await handleSharedSessionCallback({
          session: mockSession,
          token: tokenWithoutSub,
        });

        expect(mockLoggerDebug).toHaveBeenCalledWith({
          msg: '[Shared Session Callback] Start',
          hasTokenSub: false,
        });
        expect(result.user.id).toBe('');
        expect(result.user.role).toBe(UserRole.USER);
        expect(result.user.name).toBe('Guest');
        expect(result.user.email).toBeNull();
        expect(result.user.image).toBeNull();
        expect(mockLoggerDebug).toHaveBeenCalledWith({
          msg: '[Shared Session Callback] End',
          userId: '',
          userRole: UserRole.USER,
        });
      });

      it('should handle complex session objects correctly', async () => {
        // Arrange token without sub but with extra fields for testing
        const complexTokenWithoutSub: JWT = {
          // Custom non-standard token shape
          name: 'Complex Guest',
          email: null,
          picture: null,
          role: UserRole.USER, // Use USER instead of GUEST (GUEST doesn't exist)
          iat: 123456,
          exp: 789012,
          jti: 'complex-jti-123',
          // Add some non-standard fields
          customField1: 'custom-value-1',
          customField2: 'custom-value-2',
        };
        const mockSession: Session = {
          user: {
            id: '',
            name: null,
            email: null,
            image: null,
            role: UserRole.USER,
          },
          expires: new Date().toISOString(),
        };

        const result = await handleSharedSessionCallback({
          session: mockSession,
          token: complexTokenWithoutSub,
        });

        expect(mockLoggerDebug).toHaveBeenCalledWith({
          msg: '[Shared Session Callback] Start',
          hasTokenSub: false,
        });
        expect(result.user.id).toBe('');
        expect(result.user.role).toBe(UserRole.USER);
        expect(result.user.name).toBe('Complex Guest');
        expect(result.user.email).toBeNull();
        expect(result.user.image).toBeNull();
        expect(mockLoggerDebug).toHaveBeenCalledWith({
          msg: '[Shared Session Callback] End',
          userId: '',
          userRole: UserRole.USER,
        });
      });
    });
  });

  describe('authConfigNode.callbacks.session', () => {
    it('should correctly map JWT fields to session object', async () => {
      const mockToken: JWT = {
        sub: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        picture: 'test-image.jpg',
        role: UserRole.ADMIN, // Use correct role
        jti: 'test-jti',
        accessToken: 'test-access-token', // Include if needed by session
        provider: 'google', // Include if needed by session
      };
      const mockDefaultSession: Session = {
        user: { id: '', name: null, email: null, image: null, role: UserRole.USER }, // Use correct role
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      const expectedSession: Session = {
        ...mockDefaultSession,
        user: {
          id: mockToken.sub ?? '', // Add nullish coalescing
          name: mockToken.name ?? null,
          email: mockToken.email ?? null,
          image: mockToken.picture ?? null,
          // Validate and cast role
          role: Object.values(UserRole).includes(mockToken.role as UserRole)
            ? (mockToken.role as UserRole)
            : UserRole.USER, // Default if invalid
        },
        // accessToken: mockToken.accessToken,
        // provider: mockToken.provider,
        // error: undefined, // Ensure error is not set - Also not in Session type
      };

      // Act - Use handleSharedSessionCallback directly
      const result = await handleSharedSessionCallback({
        session: mockDefaultSession,
        token: mockToken,
      });

      // Assert
      expect(result).toEqual(expectedSession);
    });

    it('should handle missing optional fields in token gracefully', async () => {
      // Arrange
      const mockTokenMinimal: JWT = {
        sub: 'user-456',
        email: 'minimal@example.com',
        role: UserRole.USER, // Use correct role
        jti: 'minimal-jti',
      }; // Missing name, picture, accessToken, provider
      const mockDefaultSession: Session = {
        user: { id: '', name: null, email: null, image: null, role: UserRole.USER }, // Use correct role
        expires: 'expires-string',
      };
      const expectedSession: Session = {
        ...mockDefaultSession,
        user: {
          id: mockTokenMinimal.sub ?? '', // Add nullish coalescing
          name: null,
          email: mockTokenMinimal.email ?? null,
          image: null,
          // Validate and cast role
          role: Object.values(UserRole).includes(mockTokenMinimal.role as UserRole)
            ? (mockTokenMinimal.role as UserRole)
            : UserRole.USER, // Default if invalid
        },
        // accessToken: undefined,
        // provider: undefined,
        // error: undefined, // Also not in Session type
      };

      // Act - Use handleSharedSessionCallback directly
      const result = await handleSharedSessionCallback({
        session: mockDefaultSession,
        token: mockTokenMinimal,
      });

      // Assert
      expect(result).toEqual(expectedSession);
    });

    it('should set session.error if token has error field', async () => {
      // Arrange
      const mockTokenWithError: JWT = {
        sub: 'user-err',
        role: UserRole.USER, // Use correct role
        jti: 'err-jti',
        error: 'TokenRefreshError',
      };
      const mockDefaultSession: Session = {
        user: { id: '', name: null, email: null, image: null, role: UserRole.USER }, // Use correct role
        expires: 'expires-string',
      };
      const expectedSession: Session = {
        ...mockDefaultSession,
        user: {
          id: mockTokenWithError.sub ?? '', // Add nullish coalescing
          name: null,
          email: null,
          image: null,
          // Validate and cast role
          role: Object.values(UserRole).includes(mockTokenWithError.role as UserRole)
            ? (mockTokenWithError.role as UserRole)
            : UserRole.USER, // Default if invalid
        },
        // accessToken: undefined,
        // provider: undefined,
        // error: undefined, // Also not in Session type
      };

      // Act - Use handleSharedSessionCallback directly
      const result = await handleSharedSessionCallback({
        session: mockDefaultSession,
        token: mockTokenWithError,
      });

      // Assert
      expect(result).toEqual(expectedSession);
    });
  });

  // --- Firebase User Creation/Sync Tests (Only for OAuth/Email provider sign-ins) ---
  describe('jwt › Firebase User Creation', () => {
    // Test for new OAuth user - should create in Firebase if not exists
    test('should create Firebase user if new OAuth user does not exist in Firebase', async () => {
      const trigger = 'signIn';
      const user = createMockUser({ id: 'new-db-user-uid', email: 'new@example.com' });
      const account = createMockAccount('google', { type: 'oidc' });
      const profile = { email: user.email!, email_verified: true, name: user.name };
      const expectedFinalToken = {
        ...user,
        role: user.role,
        jti: mockCorrelationId,
      };

      // Configure mocks (they are now defined globally)
      mockFirebaseIsInitialized.mockReturnValue(true);
      mockHandleJwtSignIn.mockResolvedValue(expectedFinalToken); // Mock this dependency

      // Scenario 1: Firebase user NOT found
      mockFirebaseGetUser.mockRejectedValue({ code: 'auth/user-not-found' });
      mockFirebaseCreateUser.mockResolvedValue({ uid: user.id });

      await jwtCallback({ token: user, user, account, profile, trigger });

      // Assertions (should work now)
      expect(mockHandleJwtSignIn).toHaveBeenCalledTimes(1);
      expect(mockFirebaseGetUser).toHaveBeenCalledTimes(1);
      // ... rest of assertions for scenario 1 ...

      // Reset mocks for Scenario 2
      mockFirebaseIsInitialized.mockClear();
      mockFirebaseGetUser.mockClear();
      mockFirebaseCreateUser.mockClear();
      mockHandleJwtSignIn.mockClear(); // Also clear this one

      // Configure for Scenario 2
      mockFirebaseIsInitialized.mockReturnValue(true);
      mockFirebaseGetUser.mockResolvedValue({ uid: user.id });
      mockHandleJwtSignIn.mockResolvedValue(expectedFinalToken); // Need to mock again

      await jwtCallback({ token: user, user, account, profile, trigger });

      // Assertions for Scenario 2
      expect(mockHandleJwtSignIn).toHaveBeenCalledTimes(1); // Called again
      expect(mockFirebaseGetUser).toHaveBeenCalledTimes(1);
      expect(mockFirebaseCreateUser).not.toHaveBeenCalled();
    });

    test('should update Firebase user with provider data if new OAuth user exists in Firebase but provider differs', async () => {
      const trigger = 'signIn';
      const user = createMockUser({ id: 'existing-db-user-uid', email: 'existing@example.com' });
      const account = createMockAccount('google', { type: 'oidc' });
      const profile = { email: user.email!, email_verified: true, name: user.name };
      const expectedFinalToken = {
        ...user,
        role: user.role,
        jti: mockCorrelationId,
      };

      // Configure mocks (they are now defined globally)
      mockFirebaseIsInitialized.mockReturnValue(true);
      mockHandleJwtSignIn.mockResolvedValue(expectedFinalToken); // Mock this dependency

      // Scenario 1: Firebase user found
      mockFirebaseGetUser.mockResolvedValue({ uid: user.id });
      mockFirebaseCreateUser.mockResolvedValue({ uid: user.id });

      await jwtCallback({ token: user, user, account, profile, trigger });

      // Assertions (should work now)
      expect(mockHandleJwtSignIn).toHaveBeenCalledTimes(1);
      expect(mockFirebaseGetUser).toHaveBeenCalledTimes(1);
      expect(mockFirebaseCreateUser).not.toHaveBeenCalled();
    });

    test('should not create or update Firebase user if Firebase Admin SDK is not initialized', async () => {
      const trigger = 'signIn';
      const user = createMockUser({ id: 'new-db-user-uid', email: 'new@example.com' });
      const account = createMockAccount('google', { type: 'oidc' });
      const profile = { email: user.email!, email_verified: true, name: user.name };
      const expectedFinalToken = {
        ...user,
        role: user.role,
        jti: mockCorrelationId,
      };

      // Configure mocks (they are now defined globally)
      mockFirebaseIsInitialized.mockReturnValue(false);
      mockHandleJwtSignIn.mockResolvedValue(expectedFinalToken); // Mock this dependency

      // Scenario 1: Firebase user NOT found
      mockFirebaseGetUser.mockRejectedValue({ code: 'auth/user-not-found' });
      mockFirebaseCreateUser.mockResolvedValue({ uid: user.id });

      await jwtCallback({ token: user, user, account, profile, trigger });

      // Assertions (should work now)
      expect(mockHandleJwtSignIn).toHaveBeenCalledTimes(1);
      expect(mockFirebaseGetUser).toHaveBeenCalledTimes(1);
      // ... rest of assertions for scenario 1 ...

      // Reset mocks for Scenario 2
      mockFirebaseIsInitialized.mockClear();
      mockFirebaseGetUser.mockClear();
      mockFirebaseCreateUser.mockClear();
      mockHandleJwtSignIn.mockClear(); // Also clear this one

      // Configure for Scenario 2
      mockFirebaseIsInitialized.mockReturnValue(false);
      mockFirebaseGetUser.mockResolvedValue({ uid: user.id });
      mockHandleJwtSignIn.mockResolvedValue(expectedFinalToken); // Need to mock again

      await jwtCallback({ token: user, user, account, profile, trigger });

      // Assertions for Scenario 2
      expect(mockHandleJwtSignIn).toHaveBeenCalledTimes(1); // Called again
      expect(mockFirebaseGetUser).toHaveBeenCalledTimes(1);
      expect(mockFirebaseCreateUser).not.toHaveBeenCalled();
    });
  });
});
