<script setup>
import { computed, ref } from "vue";
import { useEditorState } from "../composables/useEditorState";
import { groundTiles, objectTiles } from "../lib/tileData";
import TileSelector from "./TileSelector.vue";
import ClearConditionCard from "./ClearConditionCard.vue";
import { CLEAR_CONDITION_TYPES } from "@/features/profile/lib/clearConditionContract";

const { activeLayer, selectedTile, setSelectedTile, showGids, clearConditionType, clearConditionTargetAmount } =
  useEditorState();
const showClearConditionPopup = ref(false);

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

const clearConditionSummary = computed(() => {
  const option = CLEAR_CONDITION_TYPES.find(
    (entry) => entry.value === clearConditionType.value,
  );

  if (!option) return "Clear Condition";
  if (clearConditionType.value === "none") return option.label;
  return `${option.label}: ${clearConditionTargetAmount.value}`;
});
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
              @click="setSelectedTile(tile)"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="shrink-0 border-t-2 border-editor-border p-3">
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 border-2 border-editor-border bg-editor-bg-light px-3 py-2 text-left text-sm font-semibold text-editor-text transition-colors hover:bg-editor-bg focus:outline-none"
        @click="showClearConditionPopup = true"
      >
        <span>Clear Condition</span>
        <span class="text-xs font-medium text-editor-text-secondary">
          {{ clearConditionSummary }}
        </span>
      </button>
    </div>

    <ClearConditionCard
      v-if="showClearConditionPopup"
      @close="showClearConditionPopup = false"
    />
  </aside>
</template>
