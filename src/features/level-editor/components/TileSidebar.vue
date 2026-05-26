<script setup>
import { computed } from "vue";
import { useEditorState } from "../composables/useEditorState";
import { groundTiles, objectTiles } from "../lib/tileData";
import TileSelector from "./TileSelector.vue";
import ClearCondition from "./ClearCondition.vue";
import { CATEGORY_LABELS, UNIQUE_OBJECT_RULES } from "../lib/editorTilePolicy";

const { activeLayer, selectedTile, setSelectedTile, showGids, objectLayer } = useEditorState();

const tilesToShow = computed(() => {
  return activeLayer.value === "ground" ? groundTiles.value : objectTiles.value;
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

  for (const rule of UNIQUE_OBJECT_RULES) {
    let count = 0
    for (const tile of objectLayer.values()) {
      if (rule.tileIds.has(tile.tileId)) count += 1
    }
    if (count > 0) {
      for (const tileId of rule.tileIds) {
        map.set(tileId, rule.duplicateIssueMessage)
      }
    }
  }

  return map
})

function getBlockedMessage(tile) {
  return blockedTileMessages.value.get(tile.tileId) || null
}

function handleTileSelect(tile) {
  if (getBlockedMessage(tile)) return
  setSelectedTile(tile)
}

const categoryLabels = CATEGORY_LABELS;


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
              :key="tile.tileId"
              :tile="tile"
              :selected="selectedTile?.tileId === tile.tileId"
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
