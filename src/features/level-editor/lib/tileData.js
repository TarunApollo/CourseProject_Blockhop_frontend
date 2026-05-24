import { computed, ref } from "vue";
import { fetchTileCatalog, getCachedTileCatalog } from "@/shared/lib/fetchTileCatalog";
import {
    GROUND_ROLE_ANCHORS,
    GROUND_SPECIAL_TILEIDS,
    GROUP_RULES,
    GROUP_TILEID_ANCHORS,
    SPECIAL_AUTOTILE,
    TILE_GROUP_ORDER,
} from "./editorTilePolicy";

const tileCatalogState = ref(getCachedTileCatalog());
const currentPaletteTheme = ref("grass");

const OBJECT_TILEID_EXCLUDE = new Set([
    "door.open.bottom",
    "door.closed.top",
    "door.open.top",
    "flag.green.alt",
]);

function buildGroundPalette(catalog, theme) {
    const palette = [];
    const seenTiles = new Set(); // Keeps track of what we added to prevent duplicates

    // Put the main terrain blocks in first
    for (const anchor of GROUND_ROLE_ANCHORS) {
        let tileId = "";

        // Special objects (like spikes) stay the same regardless of theme
        if (GROUND_SPECIAL_TILEIDS.has(anchor)) {
            tileId = anchor;
        } else {
            // Normal blocks change with the theme (e.g., snow block, grass block)
            tileId = `terrain.${theme}.${anchor}`;
        }

        // Grab it from the catalog dictionary
        const tile = catalog.byId.get(tileId);

        if (tile && !seenTiles.has(tile.id)) {
            palette.push({
                tileId: tile.id,
                type: tile.type,
                category: tile.category
            });
            seenTiles.add(tile.id);
        }
    }

    // Add any other special ground tiles that we missed
    const extraSpecials = [];
    for (const specialId of GROUND_SPECIAL_TILEIDS) {
        if (!seenTiles.has(specialId)) {
            const tile = catalog.byId.get(specialId);
            if (tile) {
                extraSpecials.push({
                    tileId: tile.id,
                    type: tile.type,
                    category: tile.category
                });
                seenTiles.add(specialId);
            }
        }
    }

    // lexicographical order
    extraSpecials.sort((a, b) => a.tileId.localeCompare(b.tileId));

    // Add them 
    for (const extra of extraSpecials) {
        palette.push(extra);
    }

    // Hide the regular base block (the UI shows the AutoTile block instead)
    const finalPalette = [];
    const baseBlockId = `terrain.${theme}.block`;

    for (const tile of palette) {
        if (tile.tileId !== baseBlockId) {
            finalPalette.push(tile);
        }
    }

    return finalPalette;
}

function buildObjectPalette(catalogTiles) {
    const palette = [];

    // lookup to score groups 
    const groupScores = {};
    let score = 0;
    for (const groupKey of TILE_GROUP_ORDER) {
        groupScores[groupKey] = score++;
    }

    // Dump all valid objects into a single flat list with sorting scores 
    for (const tile of catalogTiles) {
        // Skip world tiles or tiles we want to hide (like half-doors)
        if (tile.layer !== "object" || OBJECT_TILEID_EXCLUDE.has(tile.id)) {
            continue;
        }

        // what group this tile belongs to
        let tileGroup = null;
        for (const groupKey in GROUP_RULES) {
            if (GROUP_RULES[groupKey].categories.includes(tile.category)) {
                tileGroup = groupKey;
                break;
            }
        }

        if (!tileGroup || groupScores[tileGroup] === undefined) {
            continue;
        }

        // Check if anchor 
        const anchors = GROUP_TILEID_ANCHORS[tileGroup] || [];
        let anchorScore = anchors.indexOf(tile.id);
        if (anchorScore === -1) {
            anchorScore = 999;
        }

        // palette object
        const paletteEntry = {
            tileId: tile.id,
            type: tile.type,
            category: tile.category,
            _groupScore: groupScores[tileGroup],
            _anchorScore: anchorScore
        };

        // door atomic
        if (tile.id === "door.closed.bottom") {
            paletteEntry.composite = true;
            paletteEntry.tiles = [
                { tileId: "door.closed.bottom", dx: 0, dy: 0 },
                { tileId: "door.closed.top", dx: 0, dy: -1 }
            ];
        }

        palette.push(paletteEntry);
    }

    palette.sort((a, b) => {
        if (a._groupScore !== b._groupScore) {
            return a._groupScore - b._groupScore;
        }

        if (a._anchorScore !== b._anchorScore) {
            return a._anchorScore - b._anchorScore;
        }

        if (a.type !== b.type) {
            return a.type.localeCompare(b.type);
        }
        return a.tileId.localeCompare(b.tileId);
    });

    for (const entry of palette) {
        delete entry._groupScore;
        delete entry._anchorScore;
    }

    return palette;
}

export const groundTiles = computed(() => {
    const catalog = tileCatalogState.value;
    const themedAutoTile = {
        ...SPECIAL_AUTOTILE,
        tileId: `terrain.${currentPaletteTheme.value}.block`,
    };
    if (!catalog?.byId) return [themedAutoTile];

    const palette = buildGroundPalette(catalog, currentPaletteTheme.value);
    return [themedAutoTile, ...palette];
});

export const objectTiles = computed(() => {
    const catalog = tileCatalogState.value;
    return catalog?.tiles ? buildObjectPalette(catalog.tiles) : [];
});

export async function ensureTileCatalogLoaded() {
    const catalog = await fetchTileCatalog();
    tileCatalogState.value = catalog;
    return catalog;
}

export function setPaletteTheme(theme) {
    currentPaletteTheme.value = theme || "grass";
}

export function getTileCategoryByTileId(tileId) {
    if (!tileId) return null;
    const entry = tileCatalogState.value?.byId?.get(tileId);
    return entry?.category || null;
}
