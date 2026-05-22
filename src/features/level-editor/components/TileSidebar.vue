<script setup>
import { computed } from "vue";
import { useEditorState } from "../composables/useEditorState";
import { groundTiles, objectTiles } from "../lib/tileData";
import TileSelector from "./TileSelector.vue";
import ClearCondition from "./ClearCondition.vue";

const { activeLayer, selectedTile, setSelectedTile, showGids, objectLayer } = useEditorState();

const uniqueObjectRules = [
  {
    paletteGids: new Set([69]),
    objectGids: new Set([69]),
    message: 'There can only be one Start Flag.'
  },
  {
    paletteGids: new Set([116, 117]),
    objectGids: new Set([116, 117]),
    message: 'There can only be one Exit Door.'
  }
]

const tilesToShow = computed(() => {
  return activeLayer.value === "ground" ? groundTiles : objectTiles;
});

const groupedTiles = computed(() => {
  const groups = {};
  for (const tile of tilesToShow.value) {
    if (tile.type.includes("_Side")) continue;
    if (!groups[tile.category]) {
      groups[tile.category] = [];
    }
    groups[tile.category].push(tile);
  }
  return groups;
});

const blockedTileMessages = computed(() => {
  const map = new Map()

  for (const rule of uniqueObjectRules) {
    let count = 0
    for (const tile of objectLayer.values()) {
      if (rule.objectGids.has(tile.gid)) count += 1
    }
    if (count > 0) {
      for (const gid of rule.paletteGids) {
        map.set(gid, rule.message)
      }
    }
  }

  return map
})

function getBlockedMessage(tile) {
  return blockedTileMessages.value.get(tile.gid) || null
}

function handleTileSelect(tile) {
  if (getBlockedMessage(tile)) return
  setSelectedTile(tile)
}

const categoryLabels = {
  ground: "Ground Tiles",
  special: "Special Platforms",
  hazard: "Hazards",
  essential: "Essential Objects",
  item: "Items & Boxes",
  enemy: "Enemies",
  collectible: "Collectibles",
  decoration: "Decorations",
};


</script>

<template>
  <aside
    class="sidebar flex h-full w-72 flex-col border-l-2 border-editor-border bg-editor-canvas"
  >
    <div class="min-h-0 flex-1 overflow-y-auto">
      <div class="p-4">
        <h3 class="text-lg font-bold text-editor-text mb-4">
          {{ activeLayer === "ground" ? "Ground Tiles" : "Object Tiles" }}
        </h3>

        <div
          v-for="(tiles, category) in groupedTiles"
          :key="category"
          class="mb-6"
        >
          <h4 class="text-sm font-semibold text-editor-text-secondary mb-2">
            {{ categoryLabels[category] || category }}
          </h4>
          <div class="tiles-grid grid grid-cols-3 gap-2 items-start">
            <TileSelector
              v-for="tile in tiles"
              :key="tile.gid"
              :tile="tile"
              :selected="selectedTile?.gid === tile.gid"
              :show-gid="showGids"
            :disabled="Boolean(getBlockedMessage(tile))"
            :disabled-message="getBlockedMessage(tile)"
            @click="handleTileSelect(tile)"
            />
          </div>
        </div>
      </div>
    </div>

    <ClearCondition class="shrink-0" />

  </aside>
</template>
