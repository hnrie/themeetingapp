import { test, expect } from '@playwright/test';

test.describe('Meeting URL Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto('http://localhost:5173/');
  });

  test('should correctly parse and navigate to a meeting when a full URL is provided', async ({ page }) => {
    const fullMeetingUrl = 'http://localhost:5173/#gem-e2e-test-123';
    const expectedHash = '#gem-e2e-test-123';

    // 1. Arrange: Get the input field and the join button
    const meetingCodeInput = page.getByPlaceholder('Enter a code or link');
    const joinButton = page.getByRole('button', { name: 'Join' });

    // 2. Act: Fill the input with the full URL and click Join
    await meetingCodeInput.fill(fullMeetingUrl);
    await joinButton.click();

    // 3. Assert: Check if the URL hash is correct after navigation
    // Wait for the URL to contain the expected hash
    await page.waitForURL(`**/${expectedHash}`);

    // Evaluate the hash directly from the window location
    const actualHash = await page.evaluate(() => window.location.hash);

    // Assert that the actual hash matches the expected one
    expect(actualHash).toBe(expectedHash);
  });
});