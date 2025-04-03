#!/usr/bin/env node

/**
 * Script to create a test user in Firebase Auth emulator for E2E testing
 *
 * This ensures a consistent test user is available for authentication in tests
 */

const path = require('path');

const dotenv = require('dotenv');
const { initializeApp } = require('firebase/app');
const {
  getAuth,
  createUserWithEmailAndPassword,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  updateProfile,
} = require('firebase/auth');

// Load environment variables from .env.test
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Test user information
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'Test123!',
  displayName: process.env.TEST_USER_DISPLAY_NAME || 'Test User',
};

// Firebase configuration for connecting to emulator
const firebaseConfig = {
  apiKey: 'fake-api-key',
  authDomain: 'localhost',
  projectId: 'next-firebase-base-template',
};

async function setupTestUser() {
  console.log('Setting up test user in Firebase Auth emulator...');
  console.log(`Email: ${TEST_USER.email}`);
  console.log(`Display Name: ${TEST_USER.displayName}`);

  try {
    // Initialize Firebase app
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // Connect to Auth emulator with proper options
    // Added apiHost property to fix connection issues
    connectAuthEmulator(auth, 'http://localhost:9099', {
      disableWarnings: true,
      apiHost: 'http://localhost:9099',
    });

    // Log the emulator connection attempt
    console.log('Connecting to Auth emulator at http://localhost:9099...');

    try {
      // Try to create the user
      console.log('Attempting to create test user...');
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        TEST_USER.email,
        TEST_USER.password
      );

      // Set display name
      await updateProfile(userCredential.user, {
        displayName: TEST_USER.displayName,
      });

      console.log(`✅ Test user created successfully with UID: ${userCredential.user.uid}`);
    } catch (createError) {
      if (createError.code === 'auth/email-already-in-use') {
        console.log('Test user already exists, signing in to verify...');

        try {
          // Sign in to verify credentials work
          const userCredential = await signInWithEmailAndPassword(
            auth,
            TEST_USER.email,
            TEST_USER.password
          );

          console.log(`✅ Verified existing test user with UID: ${userCredential.user.uid}`);
        } catch (signInError) {
          console.error('❌ Failed to verify existing test user:', signInError);
          console.log('Error code:', signInError.code);
          console.log('Error message:', signInError.message);
          process.exit(1);
        }
      } else {
        console.error('❌ Failed to create test user:', createError);
        console.log('Error code:', createError.code);
        console.log('Error message:', createError.message);
        process.exit(1);
      }
    }

    console.log('✅ Test user setup complete.');
  } catch (error) {
    console.error('❌ Firebase setup error:', error);
    console.log('\nMake sure the Firebase Auth emulator is running:');
    console.log('npm run firebase:emulators');
    process.exit(1);
  }
}

// Run the setup
setupTestUser().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
