<script setup>
import { computed } from "vue";
import { useEditorState } from "../composables/useEditorState";
import { groundTiles, objectTiles } from "../lib/tileData";
import TileSelector from "./TileSelector.vue";

const { activeLayer, selectedTile, setSelectedTile, showGids } =
  useEditorState();

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
</script>

<template>
  <aside
    class="sidebar w-72 bg-editor-canvas border-l-2 border-editor-border overflow-y-auto"
  >
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
  </aside>
</template>
