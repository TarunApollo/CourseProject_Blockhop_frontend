import { expect, test } from '@playwright/test';
import { mockEditorBackend, mockLevelId } from './editor-fixtures.js';

const GRID_WIDTH = 256;

async function insertTile(page, tileId, index) {
  await page.getByTestId(`tile-selector-${tileId}`).click();
  await page.locator('[data-testid="editor-canvas"] .tile-cell').nth(index).click();
  await page.getByRole('button', { name: 'GIDs' }).click();
}

async function makeBasicValidLevel(page) {
  await page.getByRole('button', { name: 'Ground' }).click();

  await insertTile(page, 'terrain.grass.block', 0 + GRID_WIDTH);
  await insertTile(page, 'terrain.grass.block', 1 + GRID_WIDTH);
  await insertTile(page, 'terrain.grass.block', 2 + GRID_WIDTH);
  await insertTile(page, 'terrain.grass.block', 3 + GRID_WIDTH);
  await insertTile(page, 'terrain.grass.block', 4 + GRID_WIDTH);

  await page.getByRole('button', { name: 'Objects' }).click();

  await insertTile(page, 'flag.green', 0);
  await insertTile(page, 'door.closed.bottom', 4);
}

test.describe('level editor', () => {
  test.beforeEach(async ({ page }) => {
    await mockEditorBackend(page);
  });

  test('lets you go back without need for validation if there are no changes', async ({ page }) => {
    await page.goto(`/editor/${mockLevelId}`);

    await page.getByRole('button', { name: 'Go back' }).click();
    
    await expect(page).toHaveURL(/\/home$/);
  });

  test('checks that the editor does not validate if there is a missing start flag, a missing exit door and no ground tiles', async ({ page }) => {
    await page.goto(`/editor/${mockLevelId}`);

    await page.getByRole('button', { name: 'Validate' }).click();

    await expect(page.getByRole('heading', { name: 'Validation Errors' })).toBeVisible();
    await expect(
      page.locator('.validation-results li', { hasText: 'Missing start flag' }),
    ).toBeVisible();
    await expect(
      page.locator('.validation-results li', { hasText: 'Missing exit door' }),
    ).toBeVisible();
    await expect(
      page.locator('.validation-results li', { hasText: 'Level has no ground tiles' }),
    ).toBeVisible();
    await expect(page.getByText('Level Valid & Saved!')).toHaveCount(0);
  });

  test('undo and redo buttons are disabled when there are no actions to undo or redo', async ({ page }) => {
    await page.goto(`/editor/${mockLevelId}`);

    await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Redo' })).toBeDisabled();
  });

  test('undoes a tile paint action and shows the undo button as disabled when there are no more actions to undo', async ({ page }) => {
    await page.goto(`/editor/${mockLevelId}`);

    await expect(page.getByTestId('tile-selector-terrain.grass.block')).toBeVisible();
    
    await page.getByRole('button', { name: 'Ground' }).click();
    await insertTile(page, 'terrain.grass.block', 0);

    await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();

    await page.getByRole('button', { name: 'Undo' }).click();

    await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  test('redoes a tile paint action and shows the undo button as enabled after an undo', async ({ page }) => {
    await page.goto(`/editor/${mockLevelId}`);

    await expect(page.getByTestId('tile-selector-terrain.grass.block')).toBeVisible();

    await page.getByRole('button', { name: 'Ground' }).click();
    await insertTile(page, 'terrain.grass.block', 0);

    await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();

    await page.getByRole('button', { name: 'Undo' }).click();

    await expect(page.getByRole('button', { name: 'Redo' })).toBeEnabled();

    await page.getByRole('button', { name: 'Redo' }).click();

    await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();
  });

  test('successfully deletes a ground tile', async ({ page }) => {
    await page.goto(`/editor/${mockLevelId}`);

    await page.getByRole('button', { name: 'Ground' }).click();
    await insertTile(page, 'terrain.grass.block', 0);

    await page.getByRole('button', { name: 'Eraser tool' }).click();
    await page.locator('[data-testid="editor-canvas"] .tile-cell').first().click();

    const firstCell = page.locator('[data-testid="editor-canvas"] .tile-cell').first();
    const afterTile = await firstCell.getAttribute('data-tile-id');
    const afterObj = await firstCell.getAttribute('data-object-id');
    expect(afterTile).toBeNull();
    expect(afterObj).toBeNull();
  });

  test('successfully deletes an object tile', async ({ page }) => {
    await page.goto(`/editor/${mockLevelId}`);

    await page.getByRole('button', { name: 'Objects' }).click();
    await insertTile(page, 'flag.green', 0);

    await page.getByRole('button', { name: 'Eraser tool' }).click();
    await page.locator('[data-testid="editor-canvas"] .tile-cell').first().click();

    const firstCell = page.locator('[data-testid="editor-canvas"] .tile-cell').first();
    const afterTile = await firstCell.getAttribute('data-tile-id');
    const afterObj = await firstCell.getAttribute('data-object-id');
    expect(afterTile).toBeNull();
    expect(afterObj).toBeNull();
  });

  test('does not delete a ground tile after clicking the Objects button', async ({ page }) => {
    await page.goto(`/editor/${mockLevelId}`);

    await page.getByRole('button', { name: 'Ground' }).click();
    await insertTile(page, 'terrain.grass.block', 0);

    await page.getByRole('button', { name: 'Objects' }).click();

    await page.getByRole('button', { name: 'Eraser tool' }).click();
    await page.locator('[data-testid="editor-canvas"] .tile-cell').first().click();

    await page.getByRole('button', { name: 'Validate' }).click();
    await expect(page.locator('.validation-results li', { hasText: 'Level has no ground tiles' })).toHaveCount(0);
  });

  test('does not delete an object tile after clicking the Ground button', async ({ page }) => {
    await page.goto(`/editor/${mockLevelId}`);

    await page.getByRole('button', { name: 'Objects' }).click();
    await insertTile(page, 'flag.green', 0);

    await page.getByRole('button', { name: 'Ground' }).click();

    await page.getByRole('button', { name: 'Eraser tool' }).click();
    await page.locator('[data-testid="editor-canvas"] .tile-cell').first().click();

    await page.getByRole('button', { name: 'Validate' }).click();
    await expect(page.locator('.validation-results li', { hasText: 'Missing start flag' })).toHaveCount(0);
  });

  test('make a simple level by adding ground tiles, a start flag, an exit door, validate it and save it', async ({ page }) => {
    await page.goto(`/editor/${mockLevelId}`);
    
    await makeBasicValidLevel(page);

    await page.getByRole('button', { name: 'Validate' }).click();
    await expect(page.getByText('Level Valid & Saved!')).toBeVisible();
  });

  test('shows the correct validation errors after inserting an object tile over a ground tile', async ({ page }) => {
    await page.goto(`/editor/${mockLevelId}`);

    await makeBasicValidLevel(page);

    await page.getByRole('button', { name: 'Objects' }).click();
    await insertTile(page, 'item.crate.box', 2 + GRID_WIDTH);

    await page.getByRole('button', { name: 'Validate' }).click();

    await expect(page.getByRole('heading', { name: 'Validation Errors' })).toBeVisible();
    await expect(
      page.locator('.validation-results li', { hasText: 'This object overlaps with a ground tile. at (2,1)' }),
    ).toBeVisible();
    await expect(page.getByText('Level Valid & Saved!')).toHaveCount(0);
  });

  test('does not allow to insert more than one start flag or more than one exit door', async ({ page }) => {
    await page.goto(`/editor/${mockLevelId}`);

    await makeBasicValidLevel(page);

    await page.getByRole('button', { name: 'Objects' }).click();
    await expect(page.getByTestId('tile-selector-flag.green')).toBeDisabled();

    const flagCells = page.locator('[data-testid="editor-canvas"] .tile-cell', { hasText: 'flag.green' });
    await expect(flagCells).toHaveCount(1);
    
    await expect(page.getByTestId('tile-selector-door.closed.bottom')).toBeDisabled();

    const doorCells = page.locator('[data-testid="editor-canvas"] .tile-cell', { hasText: 'door.closed.bottom' });
    await expect(doorCells).toHaveCount(1);
  });

  test('checks that autotiling works correctly by clicking on the first ground tile and swiping the paintbrush tool over adjacent tiles', async ({ page }) => {
    await page.goto(`/editor/${mockLevelId}`);

    await page.getByRole('button', { name: 'Ground' }).click();
    await insertTile(page, 'terrain.grass.block', 0);

    await page.getByTestId('tile-selector-terrain.grass.block').click();
    await page.getByRole('button', { name: 'Paintbrush tool' }).click();

    // We wait for the initial tile to be painted before attempting a swipe
    const firstCell = page.locator('[data-testid="editor-canvas"] .tile-cell').first();
    const secondCell = page.locator('[data-testid="editor-canvas"] .tile-cell').nth(1);
    const thirdCell = page.locator('[data-testid="editor-canvas"] .tile-cell').nth(GRID_WIDTH);

    const firstBox = await firstCell.boundingBox();
    const secondBox = await secondCell.boundingBox();
    const thirdBox = await thirdCell.boundingBox();

    if (!firstBox || !secondBox || !thirdBox) {
      throw new Error('Failed to get bounding boxes for tile cells');
    }

    // Then we move to center of first cell, press down, move through centers, then release
    await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2, { steps: 6 });
    await page.mouse.move(thirdBox.x + thirdBox.width / 2, thirdBox.y + thirdBox.height / 2, { steps: 6 });
    await page.mouse.up();

    await expect(firstCell).toHaveText(/terrain.grass.block/);
    await expect(secondCell).toHaveText(/terrain.grass.block/);
    await expect(thirdCell).toHaveText(/terrain.grass.block/);
  });

  test('checks that the autotiling works correctly by clicking on the first tile and swiping randomly over the entire canvas', async ({ page }) => {
    await page.goto(`/editor/${mockLevelId}`);

    await page.getByRole('button', { name: 'Ground' }).click();
    await insertTile(page, 'terrain.grass.block', 0);

    await page.getByTestId('tile-selector-terrain.grass.block').click();
    await page.getByRole('button', { name: 'Paintbrush tool' }).click();

    const showGidsButton = page.locator('button[title="Show GIDs"]');
    if (await showGidsButton.count()) {
      await showGidsButton.click();
    }

    const canvas = page.locator('[data-testid="editor-canvas"]');
    const canvasBox = await canvas.boundingBox();

    if (!canvasBox) {
      throw new Error('Failed to get bounding box for editor canvas');
    }

    await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
    await page.mouse.down();
    for (let i = 0; i < 20; i++) {
      const randomX = canvasBox.x + Math.random() * canvasBox.width;
      const randomY = canvasBox.y + Math.random() * canvasBox.height;
      await page.mouse.move(randomX, randomY, { steps: 10 });
    }
    await page.mouse.up();
    const grassTiles = page.locator('[data-testid="editor-canvas"] .tile-cell', { hasText: 'terrain.grass.block' });
    const grassCount = await grassTiles.count();
    expect(grassCount).toBeGreaterThan(1);

    const autotileVariants = page.locator(
      '[data-testid="editor-canvas"] .tile-cell',
      {
        hasText: /terrain\.grass\.block\.(top\.left|top\.right|top|horizontal\.left|horizontal\.middle|horizontal\.right|vertical\.top)/,
      },
    );
    const autotileVariantCount = await autotileVariants.count();
    expect(autotileVariantCount).toBeGreaterThan(0);
  });

});
