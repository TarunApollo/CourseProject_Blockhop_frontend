import { expect, test } from '@playwright/test';
import { mockEditorBackend, mockLevelId, mockEditorPolicy } from './editor-fixtures.js';

async function paintFirstCell(page, tileId) {
  await page.getByTestId(`tile-selector-${tileId}`).click();
  await page.locator('[data-testid="editor-canvas"] .tile-cell').first().click();
  await page.getByRole('button', { name: 'GIDs' }).click();
}

  async function paintAtIndex(page, tileId, index) {
    await page.getByTestId(`tile-selector-${tileId}`).click();
    await page.locator('[data-testid="editor-canvas"] .tile-cell').nth(index).click();
    await page.getByRole('button', { name: 'GIDs' }).click();
  }

test.describe('level editor', () => {
  test.beforeEach(async ({ page }) => {
    await mockEditorBackend(page);
  });

  test('checks that the editor does not validate if there are validation errors like missing ground support', async ({ page }) => {
    await page.goto(`/editor/${mockLevelId}`);

    await page.getByRole('button', { name: 'Objects' }).click();
    await expect(page.getByText('Object Tiles')).toBeVisible();
    await page.getByTestId('tile-selector-item.crate.box').click();
    await page.locator('[data-testid="editor-canvas"] .tile-cell').first().click();

    await page.getByRole('button', { name: 'Validate' }).click();

    await expect(page.getByRole('heading', { name: 'Validation Errors' })).toBeVisible();
    await expect(
      page.locator('.validation-results li', {
        hasText: 'This object has no ground support below it. at (0,0)',
      }),
    ).toBeVisible();
    await expect(page.getByText('Level Valid & Saved!')).toHaveCount(0);
  });

  test('checks that the editor does not validate if there is a missing start flag', async ({ page }) => {
    await page.goto(`/editor/${mockLevelId}`);

    await page.getByRole('button', { name: 'Validate' }).click();

    await expect(page.getByRole('heading', { name: 'Validation Errors' })).toBeVisible();
    await expect(
      page.locator('.validation-results li', { hasText: 'Missing start flag' }),
    ).toBeVisible();
    await expect(page.getByText('Level Valid & Saved!')).toHaveCount(0);
  });

  test('checks that the editor does not validate if there is a missing exit door', async ({ page }) => {
    await page.goto(`/editor/${mockLevelId}`);

    await page.getByRole('button', { name: 'Validate' }).click();

    await expect(page.getByRole('heading', { name: 'Validation Errors' })).toBeVisible();
    await expect(
      page.locator('.validation-results li', { hasText: 'Missing exit door' }),
    ).toBeVisible();
    await expect(page.getByText('Level Valid & Saved!')).toHaveCount(0);
  });
  
  test('checks that the editor does not validate if there are no ground tiles', async ({ page }) => {
    await page.route('**/assets/editor-policy', async (route) => {
      const p = { ...mockEditorPolicy, uniqueObjectRules: [] };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(p) });
    });
    await page.goto(`/editor/${mockLevelId}`);

    await page.getByRole('button', { name: 'Validate' }).click();

    await expect(page.getByRole('heading', { name: 'Level Valid & Saved!' })).toBeVisible();
    await expect(
      page.locator('.validation-results li', { hasText: 'Level has no ground tiles' }),
    ).toBeVisible();
  });

  test('undoes a tile paint action and shows the undo button as disabled when there are no more actions to undo', async ({ page }) => {
    await page.goto(`/editor/${mockLevelId}`);

    await expect(page.getByRole('heading', { name: /Level Editor - Level:/ })).toBeVisible();
    await expect(page.getByTestId('tile-selector-terrain.grass.block')).toBeVisible();

    
    await page.getByRole('button', { name: 'Ground' }).click();
    await paintAtIndex(page, 'terrain.grass.block', 0);

    await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();

    await page.getByRole('button', { name: 'Undo' }).click();

    await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  test('redoes a tile paint action and shows the undo button as enabled after an undo', async ({ page }) => {
    await page.goto(`/editor/${mockLevelId}`);

    await expect(page.getByRole('heading', { name: /Level Editor - Level:/ })).toBeVisible();
    await expect(page.getByTestId('tile-selector-terrain.grass.block')).toBeVisible();

    await page.getByRole('button', { name: 'Ground' }).click();
    await paintAtIndex(page, 'terrain.grass.block', 0);

    await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();

    await page.getByRole('button', { name: 'Undo' }).click();

    await expect(page.getByRole('button', { name: 'Redo' })).toBeEnabled();

    await page.getByRole('button', { name: 'Redo' }).click();

    await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();
  });

  test('lets you paint a tile and save it through the real editor UI', async ({ page }) => {
    await page.route('**/assets/editor-policy', async (route) => {
      const p = { ...mockEditorPolicy, uniqueObjectRules: [] };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(p) });
    });
    await page.goto(`/editor/${mockLevelId}`);

    await expect(page.getByRole('heading', { name: /Level Editor - Level: "Level Editor Practice"/ })).toBeVisible();
    await expect(page.getByText('Ground Tiles')).toBeVisible();

    await page.getByRole('button', { name: 'Ground' }).click();
    await paintAtIndex(page, 'terrain.grass.block', 0);

    await page.getByRole('button', { name: 'Validate' }).click();
    await expect(page.getByText('Level Valid & Saved!')).toBeVisible();
  });

  test('lets you paint and save the hill tile', async ({ page }) => {
    await page.route('**/assets/editor-policy', async (route) => {
      const p = { ...mockEditorPolicy, uniqueObjectRules: [] };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(p) });
    });
    await page.goto(`/editor/${mockLevelId}`);

    await page.getByRole('button', { name: 'Ground' }).click();
    await paintAtIndex(page, 'terrain.grass.hill', 0);

    await page.getByRole('button', { name: 'Validate' }).click();
    await expect(page.getByText('Level Valid & Saved!')).toBeVisible();
  });

  test('lets you paint and save the platform tile', async ({ page }) => {
    await page.route('**/assets/editor-policy', async (route) => {
      const p = { ...mockEditorPolicy, uniqueObjectRules: [] };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(p) });
    });
    await page.goto(`/editor/${mockLevelId}`);

    await page.getByRole('button', { name: 'Ground' }).click();
    await paintAtIndex(page, 'terrain.grass.platform', 0);

    await page.getByRole('button', { name: 'Validate' }).click();
    await expect(page.getByText('Level Valid & Saved!')).toBeVisible();
  });

  test('shows the unsaved changes guard before leaving the editor', async ({ page }) => {
    await page.goto(`/editor/${mockLevelId}`);

    await paintFirstCell(page, 'terrain.grass.block');

    await page.getByRole('button', { name: 'Go back' }).click();

    await expect(page.getByRole('heading', { name: 'Unsaved Changes' })).toBeVisible();
    await page.getByRole('button', { name: 'Discard & Leave' }).click();

    await expect(page).toHaveURL(/\/home$/);
  });
});
