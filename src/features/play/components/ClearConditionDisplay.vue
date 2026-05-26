<script setup>
import { computed } from "vue";
import { getTileSpriteStyleByTileId } from "@/shared/lib/tileUtils";

const props = defineProps({
  conditionType: { type: String, default: "none" },
  currentAmount: { type: Number, default: 0 },
  requiredAmount: { type: Number, default: 0 },
});

const conditionTileId = computed(() => {
  const type = props.conditionType?.toLowerCase() || "none";
  if (type.includes("coin")) return "coin.gold";
  if (type.includes("slime")) return "enemy.slime.normal";
  if (type.includes("snail")) return "enemy.snail";
  if (type.includes("box")) return "block.plank";
  if (type.includes("bee")) return "enemy.bee";
  return "coin.bronze";
});

const isCompleted = computed(() => {
  if (props.conditionType === "none") return true;
  return props.currentAmount >= props.requiredAmount;
});
</script>

<template>
  <div
    class="flex items-center justify-center h-[52px] gap-3 bg-hud-pill border-2 border-white px-4 pointer-events-none shadow-hud"
  >
    <div :style="getTileSpriteStyleByTileId(conditionTileId, 40)"></div>
    <span
      class="font-number-prop text-xl sm:text-2xl leading-none"
      :class="isCompleted ? 'text-game-primary' : 'text-white'"
    >
      {{ currentAmount }} / {{ requiredAmount }}
    </span>
  </div>
</template>
