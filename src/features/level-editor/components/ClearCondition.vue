<script setup>
import { computed } from "vue";
import { useEditorState } from "../composables/useEditorState";
import { CLEAR_CONDITION_TYPES } from "@/features/profile/lib/clearConditionContract";
import { getTileSpriteStyleByTileId } from "@/shared/lib/tileUtils";
import { CLEAR_CONDITION_TILE_IDS } from "../lib/editorTilePolicy";

const {
  clearConditionType,
  clearConditionTargetAmount,
  setClearConditionType,
  setClearConditionTargetAmount,
  levelTheme,
  setLevelTheme,
} = useEditorState();

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

function getSpriteStyle(tileId) {
  return getTileSpriteStyleByTileId(tileId, TILE_PREVIEW_SIZE);
}

const currentTileId = computed(() => CLEAR_CONDITION_TILE_IDS[clearConditionType.value] ?? null);

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

const countLabel = computed(() => {
  switch (clearConditionType.value) {
    case "coin":
      return "Coin Count";
    case "box":
      return "Box Count";
    case "slime":
    case "snail":
    case "bee":
      return "Kill Count";
    default:
      return "Count";
  }
});
</script>

<template>
  <div class="border-t-2 border-editor-border">
    <!-- Themes! -->
    <div class="px-3 py-2 border-b border-editor-border/20">
      <h4 class="text-xs font-semibold text-editor-text-secondary uppercase tracking-wide mb-2">
        Level Theme
      </h4>
      <div class="grid grid-cols-2 gap-1.5">
        <button
          v-for="t in ['grass', 'snow', 'purple', 'sand']"
          :key="t"
          @click="setLevelTheme(t)"
          class="py-1.5 px-2 rounded-lg border-2 text-[10px] font-bold transition-all focus:outline-none flex items-center justify-between capitalize shadow-sm hover:scale-[1.02] active:scale-[0.98]"
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
      <div class="grid grid-cols-3 gap-1">
        <button
          v-for="t in CLEAR_CONDITION_TYPES"
          :key="t.value"
          @click="selectType(t.value)"
          class="py-1.5 rounded-lg border-2 text-[10px] font-semibold transition-all focus:outline-none truncate"
          :class="
            clearConditionType === t.value
              ? 'border-editor-border bg-editor-border text-white'
              : 'border-editor-border/30 bg-editor-bg-lighter/50 text-editor-text-secondary hover:bg-editor-bg/30 hover:border-editor-border/50'
          "
          :title="t.label"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <!-- Config section -->
    <div v-if="clearConditionType !== 'none'" class="px-3 pb-3 space-y-2">
      <!-- Count input -->
      <div class="space-y-1">
        <p class="text-[10px] text-editor-text-secondary/70 uppercase tracking-wide font-semibold">
          {{ countLabel }}
        </p>
        <div class="flex items-center gap-2">
          <div
            v-if="currentTileId"
            class="w-8 h-8 shrink-0 rounded-sm"
            :style="getSpriteStyle(currentTileId)"
          />
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
    <div v-else class="px-3 pb-3">
      <p class="text-[10px] text-editor-text-secondary/50 italic">
        No condition set — exit door stays open
      </p>
    </div>
  </div>
</template>
