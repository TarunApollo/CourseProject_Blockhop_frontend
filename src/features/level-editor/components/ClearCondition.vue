<script setup>
import { computed } from "vue";
import { useEditorState } from "../composables/useEditorState";
import { getClearConditionTypes } from "@/features/profile/lib/clearConditionContract";
import { getCachedTileCatalog } from "@/shared/lib/fetchTileCatalog";
import { getTileSpriteStyleByTileId } from "@/shared/lib/tileUtils";

const {
  clearConditionType,
  clearConditionTargetAmount,
  setClearConditionType,
  setClearConditionTargetAmount,
  levelTheme,
  setLevelTheme,
} = useEditorState();

const conditionTypes = computed(() => getClearConditionTypes(getCachedTileCatalog()));

function getThemeDotStyle(themeName) {
  const colors = {
    grass: "#7BCF73",
    snow: "#BAE6FD",
    purple: "#C084FC",
    sand: "#FDE047",
  };
  return {
    backgroundColor: colors[themeName] || "#ffffff",
  };
}

const TILE_PREVIEW_SIZE = 32;

function getSpriteStyle(tileId, displaySize = TILE_PREVIEW_SIZE) {
  return getTileSpriteStyleByTileId(tileId, displaySize);
}

function getConditionTileId(type) {
  if (type === "coin") return "coin.gold";
  if (type === "box") return "block.plank";
  if (type === "none") return "door.open.bottom";
  return type; // Enemy tile IDs match their condition value
}

function selectType(type) {
  setClearConditionType(type);
}

function incrementCount() {
  if (clearConditionType.value === "none") return;
  setClearConditionTargetAmount(
    Math.max(1, (clearConditionTargetAmount.value || 0) + 1),
  );
}

function decrementCount() {
  if (clearConditionType.value === "none") return;
  setClearConditionTargetAmount(
    Math.max(1, (clearConditionTargetAmount.value || 0) - 1),
  );
}

function handleCountInput(event) {
  const val = Number(event.target.value);
  if (clearConditionType.value === "none") return;
  setClearConditionTargetAmount(
    Number.isFinite(val) && val >= 1 ? val : 1,
  );
}

</script>

<template>
  <div class="border-t-2 border-editor-border">
    <!-- Themes! -->
    <div class="px-3 py-2 border-b border-editor-border/20">
      <h4 class="text-xs font-semibold text-editor-text-secondary uppercase tracking-wide mb-2">
        Level Theme
      </h4>
      <div class="scrollbar-hidden flex gap-1.5 overflow-x-auto overflow-y-hidden pb-1">
        <button
          v-for="t in ['grass', 'snow', 'purple', 'sand']"
          :key="t"
          @click="setLevelTheme(t)"
          class="h-9 min-w-16 shrink-0 rounded-lg border-2 px-2 text-[10px] font-bold transition-all focus:outline-none flex items-center justify-between gap-2 capitalize shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          :class="
            levelTheme === t
              ? 'border-editor-border bg-editor-border text-white shadow'
              : 'border-editor-border/30 bg-editor-bg-lighter/40 text-editor-text-secondary hover:bg-editor-bg/30 hover:border-editor-border/50'
          "
        >
          <span>{{ t }}</span>
          <div
            class="w-3.5 h-3.5 rounded-full border border-black/10 flex items-center justify-center shrink-0"
            :style="getThemeDotStyle(t)"
          >
            <div v-if="levelTheme === t" class="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
        </button>
      </div>
    </div>

    <div class="px-3 py-2 pb-1">
      <h4 class="text-xs font-semibold text-editor-text-secondary uppercase tracking-wide">
        Clear Condition
      </h4>
    </div>

    <!-- Type selector -->
    <div class="px-3 pb-2">
      <div class="scrollbar-hidden flex gap-1 overflow-x-auto overflow-y-hidden pb-1">
        <button
          v-for="t in conditionTypes"
          :key="t.value"
          @click="selectType(t.value)"
          class="h-12 min-w-16 shrink-0 rounded-lg border-2 transition-all focus:outline-none flex items-center justify-center"
          :class="
            clearConditionType === t.value
              ? 'border-editor-border bg-editor-border shadow'
              : 'border-editor-border/30 bg-editor-bg-lighter/50 hover:bg-editor-bg/30 hover:border-editor-border/50'
          "
          :title="t.label"
          :aria-label="t.label"
        >
          <span
            class="shrink-0"
            :style="getSpriteStyle(getConditionTileId(t.value), 30)"
          />
        </button>
      </div>
    </div>

    <!-- Config section -->
    <div v-if="clearConditionType !== 'none'" class="px-3 pb-3 space-y-2">
      <!-- Count input -->
      <div>
        <div class="flex items-center justify-center">
          <div
            class="flex items-center border-2 border-editor-border rounded-lg overflow-hidden bg-editor-canvas/80"
          >
            <button
              @click="decrementCount"
              class="w-8 h-8 flex items-center justify-center text-editor-text-secondary hover:bg-editor-bg/40 active:bg-editor-border/30 transition-colors focus:outline-none text-lg font-bold leading-none"
            >
              −
            </button>
            <input
              :value="clearConditionTargetAmount"
              type="number"
              min="1"
              max="100"
              class="w-14 text-center text-sm border-0 border-x border-editor-border/30 py-1.5 focus:outline-none focus:ring-0 bg-editor-canvas/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
              @input="handleCountInput"
            />
            <button
              @click="incrementCount"
              class="w-8 h-8 flex items-center justify-center text-editor-text-secondary hover:bg-editor-bg/40 active:bg-editor-border/30 transition-colors focus:outline-none text-lg font-bold leading-none"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- No condition hint -->
    <div v-else class="pb-2" />
  </div>
</template>

<style scoped>
.scrollbar-hidden {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scrollbar-hidden::-webkit-scrollbar {
  display: none;
}
</style>
