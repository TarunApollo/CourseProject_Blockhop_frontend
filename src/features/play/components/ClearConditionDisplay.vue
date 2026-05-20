<script setup>
import { computed } from "vue";
import { getTileSpriteStyle } from "@/shared/lib/tileUtils";

const props = defineProps({
  conditionType: { type: String, default: "none" },
  currentAmount: { type: Number, default: 0 },
  requiredAmount: { type: Number, default: 0 },
});

const conditionGid = computed(() => {
  const type = props.conditionType?.toLowerCase() || "none";
  if (type.includes("coin")) return 109;
  if (type.includes("slime")) return 91;
  if (type.includes("snail")) return 92;
  if (type.includes("box")) return 42;
  if (type.includes("bee")) return 93;
  return 131;
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
    <div :style="getTileSpriteStyle(conditionGid, 40)"></div>
    <span
      class="font-number-prop text-xl sm:text-2xl leading-none"
      :class="isCompleted ? 'text-game-primary' : 'text-white'"
    >
      {{ currentAmount }} / {{ requiredAmount }}
    </span>
  </div>
</template>
