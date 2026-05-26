const API_BASE_URL = 'http://127.0.0.1:4173/backend';

export const mockLevelId = 'level-1';

export const mockLevel = {
  id: mockLevelId,
  title: 'Level Editor Practice',
  description: 'A tiny level used by the Playwright E2E suite.',
  clearCondition: {
    condition: { type: 'none' },
    targetAmount: 0,
  },
  worldLayer: {},
  objectLayer: {},
};

const mockCatalog = {
  tiles: [
    {
      id: 'terrain.grass.block',
      type: 'Terrain_Block',
      category: 'ground',
      layer: 'world',
    },
    {
      id: 'terrain.grass.hill',
      type: 'Terrain_Block',
      category: 'ground',
      layer: 'world',
    },
    {
      id: 'terrain.grass.platform',
      type: 'Terrain_Block',
      category: 'ground',
      layer: 'world',
    },
    {
      id: 'item.crate.box',
      type: 'Item_Box',
      category: 'item',
      layer: 'object',
    },
    {
      id: 'flag.green',
      type: 'Start_Flag',
      category: 'essential',
      layer: 'object',
    },
    {
      id: 'door.closed.bottom',
      type: 'Door',
      category: 'essential',
      layer: 'object',
    },
  ],
};

export const mockEditorPolicy = {
  needsSupportCategories: ['item', 'enemy', 'decoration', 'essential'],
  solidCategories: ['ground', 'special', 'hazard', 'item'],
  boxTileIds: [],
  coinTileIds: ['coin.gold'],
  flyingTileIds: [],
  groundSpecialTileIds: [],
  categoryLabels: {
    ground: 'Ground',
  },
  tileGroupOrder: ['ground', 'object'],
  groupRules: {
    ground: {
      categories: ['ground'],
    },
    object: {
      categories: ['item', 'essential'],
    },
  },
  groundRoleAnchors: ['block', 'hill', 'platform'],
  groupTileIdAnchors: {
    ground: ['terrain.grass.block'],
    object: ['item.crate.box', 'flag.green', 'door.closed.bottom'],
  },
  specialAutoTile: {
    tileId: 'terrain.grass.block',
    type: 'Terrain_Block',
    category: 'ground',
  },
  uniqueObjectRules: [],
};

mockEditorPolicy.uniqueObjectRules = [
  {
    key: 'startFlag',
    tileIds: ['flag.green'],
    requiredErrorMessage: 'Missing start flag',
    duplicateErrorMessage: 'Multiple start flags',
  },
  {
    key: 'exitDoor',
    tileIds: ['door.closed.bottom'],
    requiredErrorMessage: 'Missing exit door',
    duplicateErrorMessage: 'Multiple exit doors',
  },
];

const mockFrames = {
  terrain_grass_block: {
    frame: { x: 0, y: 0, w: 128, h: 128 },
    trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w: 128, h: 128 },
    sourceSize: { w: 128, h: 128 },
  },
  terrain_grass_hill: {
    frame: { x: 128, y: 0, w: 128, h: 128 },
    trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w: 128, h: 128 },
    sourceSize: { w: 128, h: 128 },
  },
  terrain_grass_platform: {
    frame: { x: 256, y: 0, w: 128, h: 128 },
    trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w: 128, h: 128 },
    sourceSize: { w: 128, h: 128 },
  },
  item_crate_box: {
    frame: { x: 384, y: 0, w: 128, h: 128 },
    trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w: 128, h: 128 },
    sourceSize: { w: 128, h: 128 },
  },
  flag_green: {
    frame: { x: 512, y: 0, w: 128, h: 128 },
    trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w: 128, h: 128 },
    sourceSize: { w: 128, h: 128 },
  },
  door_closed_bottom: {
    frame: { x: 640, y: 0, w: 128, h: 128 },
    trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w: 128, h: 128 },
    sourceSize: { w: 128, h: 128 },
  },
};

export async function mockEditorBackend(page) {
  await page.route(`${API_BASE_URL}/csrf`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ headerName: 'X-CSRF-Token', token: 'test-token' }),
    });
  });

  await page.route(`${API_BASE_URL}/users/me`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'user-1', name: 'Test User' }),
    });
  });

  await page.route(`${API_BASE_URL}/users/profile`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ createdLevels: [mockLevel] }),
    });
  });

  await page.route(`${API_BASE_URL}/assets/editor-policy`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockEditorPolicy),
    });
  });

  await page.route(`${API_BASE_URL}/assets/tile-catalog`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockCatalog),
    });
  });

  await page.route(`${API_BASE_URL}/assets/spritesheets?type=tiles`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ frames: mockFrames }),
    });
  });

  await page.route(`${API_BASE_URL}/assets/spritesheets?type=enemies`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ frames: {} }),
    });
  });

  await page.route(`${API_BASE_URL}/editor/levels/${mockLevelId}/properties`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.route(`${API_BASE_URL}/editor/${mockLevelId}/object-layer`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.route(`${API_BASE_URL}/editor/${mockLevelId}/world-layer`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });
}
