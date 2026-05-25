export let CATEGORY_LABELS = {};
export let TILE_GROUP_ORDER = [];
export let GROUP_RULES = {};
export let GROUND_ROLE_ANCHORS = [];
export let GROUP_TILEID_ANCHORS = {};
export let BOX_TILE_IDS = new Set();
export let COIN_TILE_IDS = new Set();
export let FLYING_TILE_IDS = new Set();
export let UNIQUE_OBJECT_RULES = [];
export let GROUND_SPECIAL_TILEIDS = new Set();
export let SPECIAL_AUTOTILE = {};

// Sets for validation rules
export let needsSupportCategories = new Set(['item', 'essential', 'enemy', 'decoration']);
export let solidCategories = new Set(['ground', 'special', 'hazard', 'item']);

export function populateEditorPolicy(policy) {
  if (!policy) return;

  needsSupportCategories = new Set(policy.needsSupportCategories || []);
  solidCategories = new Set(policy.solidCategories || []);
  BOX_TILE_IDS = new Set(policy.boxTileIds || []);
  COIN_TILE_IDS = new Set(policy.coinTileIds || []);
  FLYING_TILE_IDS = new Set(policy.flyingTileIds || []);
  GROUND_SPECIAL_TILEIDS = new Set(policy.groundSpecialTileIds || []);

  CATEGORY_LABELS = policy.categoryLabels || {};
  TILE_GROUP_ORDER = policy.tileGroupOrder || [];
  GROUP_RULES = policy.groupRules || {};
  GROUND_ROLE_ANCHORS = policy.groundRoleAnchors || [];
  GROUP_TILEID_ANCHORS = policy.groupTileIdAnchors || {};
  SPECIAL_AUTOTILE = policy.specialAutoTile || {};

  UNIQUE_OBJECT_RULES = (policy.uniqueObjectRules || []).map(rule => ({
    ...rule,
    tileIds: new Set(rule.tileIds || []),
  }));
}
