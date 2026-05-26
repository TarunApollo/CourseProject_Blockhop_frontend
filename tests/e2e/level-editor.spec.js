import { expect, test } from '@playwright/test';
import { mockEditorBackend, mockLevelId } from './editor-fixtures.js';

test.describe('level editor', () => {
  test.beforeEach(async ({ page }) => {
    await mockEditorBackend(page);
  });

  test('lets you paint a tile and save it through the real editor UI', async ({ page }) => {
    await page.goto(`/editor/${mockLevelId}`);

    await expect(page.getByRole('heading', { name: /Level Editor - Level: "Level Editor Practice"/ })).toBeVisible();
    await expect(page.getByText('Ground Tiles')).toBeVisible();

    await page.getByTestId('tile-selector-terrain.grass.block').click();
    await page.locator('[data-testid="editor-canvas"] .tile-cell').first().click();
    await page.getByRole('button', { name: 'GIDs' }).click();

    await expect(page.locator('[data-testid="editor-canvas"] .tile-cell').first()).toContainText('terrain.grass.block');

    await page.getByRole('button', { name: 'Validate' }).click();
    await expect(page.getByText('Level Valid & Saved!')).toBeVisible();
  });

  test('shows the unsaved changes guard before leaving the editor', async ({ page }) => {
    await page.goto(`/editor/${mockLevelId}`);

    await page.getByTestId('tile-selector-terrain.grass.block').click();
    await page.locator('[data-testid="editor-canvas"] .tile-cell').first().click();

    await page.getByRole('button', { name: 'Go back' }).click();

    await expect(page.getByRole('heading', { name: 'Unsaved Changes' })).toBeVisible();
    await page.getByRole('button', { name: 'Discard & Leave' }).click();

    await expect(page).toHaveURL(/\/home$/);
  });
});
