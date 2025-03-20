import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// Configuration constants with environment variable fallbacks
const TEST_PORT = process.env.TEST_PORT || '3001';
const TEST_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || `http://127.0.0.1:${TEST_PORT}`;
const TIMEOUT_TEST = parseInt(process.env.TIMEOUT_TEST || '120000', 10);
const TIMEOUT_NAVIGATION = parseInt(process.env.TIMEOUT_NAVIGATION || '60000', 10);
const TIMEOUT_ACTION = parseInt(process.env.TIMEOUT_ACTION || '30000', 10);
const TIMEOUT_SERVER = parseInt(process.env.TIMEOUT_SERVER || '300000', 10);
const RUN_PARALLEL = false;
const RETRY_COUNT = process.env.CI ? 2 : 1;

// Check if a base URL was specified, which means the server is already running
const skipWebServer = !!process.env.PLAYWRIGHT_TEST_BASE_URL;

// Ensure screenshots directory exists
const screenshotsDir = path.join(__dirname, '../e2e/screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

/**
 * Playwright configuration for {{YOUR_PROJECT_NAME}}
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: '../e2e',
  /* Maximum time one test can run for */
  timeout: TIMEOUT_TEST,
  /* Run tests in files in sequence rather than parallel */
  fullyParallel: false,
  /* Workers set to 1 to prevent parallel execution issues */
  workers: 1,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: RETRY_COUNT,
  /* Reporter to use */
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: TEST_BASE_URL,
    /* Collect trace when retrying the failed test */
    trace: 'retain-on-failure',
    /* Record video only when retrying a test for the first time */
    video: 'retain-on-failure',
    /* Take screenshot on test failure */
    screenshot: 'only-on-failure',
    /* Set navigation timeout */
    navigationTimeout: TIMEOUT_NAVIGATION,
    /* Set action timeout */
    actionTimeout: TIMEOUT_ACTION,
    /* Configure viewport that works well for our tests */
    viewport: { width: 1280, height: 720 },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Local development server setup - only used if PLAYWRIGHT_TEST_BASE_URL is not set */
  ...(skipWebServer ? {} : {
    webServer: {
      command: 'npm run dev',
      url: TEST_BASE_URL,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
      timeout: TIMEOUT_SERVER,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PORT: TEST_PORT,
        NEXT_PUBLIC_PLAYWRIGHT_TESTING: 'true',
      },
    }
  }),
}); 