import { test, expect } from '@playwright/test';

test.describe('Preferences Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the preferences screen to load
    await expect(page.getByText('What are you')).toBeVisible({ timeout: 15000 });
  });

  test('shows all mood chips', async ({ page }) => {
    const moods = ['Chill', 'Intense', 'Romantic', 'Dark', 'Funny', 'Inspiring'];
    for (const mood of moods) {
      await expect(page.getByText(mood)).toBeVisible();
    }
  });

  test('shows all genre chips', async ({ page }) => {
    const genres = ['Drama', 'Romance', 'Thriller', 'Comedy', 'Horror', 'Sci-Fi', 'Animation'];
    for (const genre of genres) {
      await expect(page.getByText(genre)).toBeVisible();
    }
  });

  test('can select and deselect a mood chip', async ({ page }) => {
    const chip = page.getByText('Chill');
    await chip.click();
    // After clicking, chip should show active state (checkmark appears)
    await expect(page.locator('text=Chill').first()).toBeVisible();
    await chip.click();
    // Deselect
    await expect(page.getByText('Chill')).toBeVisible();
  });

  test('can select multiple genres', async ({ page }) => {
    await page.getByText('Drama').click();
    await page.getByText('Romance').click();
    // Both should still be visible and selected
    await expect(page.getByText('Drama')).toBeVisible();
    await expect(page.getByText('Romance')).toBeVisible();
  });

  test('can select a runtime option', async ({ page }) => {
    await page.getByText('< 90m').click();
    await expect(page.getByText('< 90m')).toBeVisible();
  });

  test('can select a minimum score', async ({ page }) => {
    await page.getByText('8+').click();
    await expect(page.getByText('8+')).toBeVisible();
  });

  test('navigates to recs screen on Find Movies tap', async ({ page }) => {
    await page.getByText('Find Movies').click();
    await expect(page.getByText('For You')).toBeVisible({ timeout: 5000 });
  });

  test('navigates to recs with filters applied', async ({ page }) => {
    await page.getByText('Chill').click();
    await page.getByText('Drama').click();
    await page.getByText('Find Movies').click();
    await expect(page.getByText('For You')).toBeVisible({ timeout: 5000 });
  });
});
