import { test, expect } from '../utils/test-base';

/**
 * API Tests for the health endpoint
 */
test.describe('Health API', () => {
  test('should return health status OK', async ({ request }) => {
    // Get the response from the health endpoint
    const response = await request.get('/api/health');

    // Verify status code is 200
    expect(response.status()).toBe(200);

    // Log the actual response for debugging
    const data = await response.json();
    console.log('Health API Response:', JSON.stringify(data, null, 2));

    // Verify the response body contains the expected values
    expect(data).toMatchObject({
      status: 'ok',
      timestamp: expect.any(String),
      serverInfo: expect.objectContaining({
        environment: expect.any(String),
        port: expect.any(String),
      }),
    });

    // Verify uptime is a number
    expect(typeof data.uptime).toBe('number');
  });
});
