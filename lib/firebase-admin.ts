import * as admin from 'firebase-admin';

/**
 * Checks if the key is a test key that should be ignored
 */
function isTestKey(key: string): boolean {
  return key === 'test-private-key' || key.includes('test') || key === 'dummy-key';
}

/**
 * Formats the private key with proper newlines and headers
 */
function formatPrivateKey(key: string): string {
  // Already properly formatted key
  if (key.includes('-----BEGIN PRIVATE KEY-----') && key.includes('\n')) {
    return key;
  }

  // Handle escaped newlines (\\n)
  if (key.includes('\\n')) {
    return key.replace(/\\n/g, '\n');
  }

  // Handle keys without newlines but with proper header/footer
  if (key.includes('-----BEGIN PRIVATE KEY-----') && !key.includes('\n')) {
    return key
      .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
      .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
  }

  // Default: return as is
  return key;
}

/**
 * Helper function to safely parse the private key
 */
function parsePrivateKey(key?: string): string | undefined {
  if (!key) return undefined;

  // Test environment handling
  const isTestEnvironment =
    process.env.NODE_ENV === 'test' || process.env.USE_FIREBASE_EMULATOR === 'true';

  if (isTestEnvironment && isTestKey(key)) {
    console.log('🔸 [Admin SDK] Using placeholder private key for test environment');
    return undefined;
  }

  return formatPrivateKey(key);
}

/**
 * Get the current environment's base URL for callbacks and redirects
 */
function getEmulatorHost(): string | undefined {
  // If explicitly set via environment variables, use those
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    return process.env.FIREBASE_AUTH_EMULATOR_HOST;
  }

  // For local development with custom ports
  const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT;
  if (port && process.env.NODE_ENV !== 'production') {
    console.log(`🔸 [Admin SDK] Detected custom port: ${port}`);
    return `localhost:9099`; // Auth emulator default port
  }

  return undefined;
}

/**
 * Initialize with emulator configuration
 */
function initializeWithEmulators(): admin.app.App {
  // For test environments, use minimal configuration
  const app = admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'test-project-id',
  });

  console.log('🔸 [Admin SDK] Initialized for emulator use');

  // Get emulator host configuration
  const authEmulatorHost = getEmulatorHost();

  if (authEmulatorHost) {
    console.log(`🔸 [Admin SDK] Using Auth emulator at ${authEmulatorHost}`);
    // Auth emulator is auto-connected via environment variable
  }

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(
      `🔸 [Admin SDK] Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`
    );
    admin.firestore().settings({
      host: process.env.FIRESTORE_EMULATOR_HOST,
      ssl: false,
    });
  }

  return app;
}

/**
 * Initialize with production credentials
 */
function initializeWithCredentials(
  projectId: string,
  clientEmail: string,
  privateKey: string
): admin.app.App {
  const serviceAccount = {
    projectId,
    clientEmail,
    privateKey,
  };

  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });

  console.log('✅ [Admin SDK] Initialized with service account credentials');
  return app;
}

/**
 * Initialize with minimal configuration (fallback)
 */
function initializeWithMinimalConfig(): admin.app.App {
  const app = admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'default-project-id',
  });

  console.log('⚠️ [Admin SDK] Initialized with minimal configuration due to missing credentials');

  return app;
}

/**
 * Determines the appropriate initialization strategy based on environment and credentials
 */
function getInitStrategy() {
  // Check if we're in test mode or using emulators
  const usingEmulators =
    process.env.NODE_ENV === 'test' || process.env.USE_FIREBASE_EMULATOR === 'true';

  if (usingEmulators) {
    return { strategy: 'emulators' };
  }

  // Get production credentials
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (projectId && clientEmail && privateKey) {
    return {
      strategy: 'credentials',
      credentials: { projectId, clientEmail, privateKey },
    };
  }

  return { strategy: 'minimal' };
}

/**
 * Helper function to initialize Firebase Admin SDK
 */
function initializeFirebaseAdmin() {
  try {
    // Check if app is already initialized
    if (admin.apps.length > 0) {
      return admin;
    }

    // Determine initialization strategy
    const { strategy, credentials } = getInitStrategy();

    // Initialize based on strategy
    if (strategy === 'emulators') {
      initializeWithEmulators();
    } else if (strategy === 'credentials' && credentials) {
      const { projectId, clientEmail, privateKey } = credentials;
      initializeWithCredentials(projectId, clientEmail, privateKey);
    } else {
      initializeWithMinimalConfig();
    }

    // Log current environment for debugging
    console.log(`🔸 [Admin SDK] Current environment: ${process.env.NODE_ENV}`);
    console.log(`🔸 [Admin SDK] NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'not set'}`);

    return admin;
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    return admin;
  }
}

// Initialize and export the admin SDK
const firebaseAdmin = initializeFirebaseAdmin();
export default firebaseAdmin;
