<script setup>
import ClearConditionDisplay from "./ClearConditionDisplay.vue";
import GameTimer from "./GameTimer.vue";

const props = defineProps({
  mapData: Object,
  conditionType: { type: String, default: "none" },
  currentAmount: { type: Number, default: 0 },
  requiredAmount: { type: Number, default: 0 },
  startTime: { type: Number, default: Date.now() },
});
</script>

<template>
  <div
    class="flex items-center justify-center bg-hud-bg border-b-4 border-hud-border h-[72px] gap-4 w-full shrink-0 relative"
  >
    <ClearConditionDisplay
      v-if="mapData && conditionType !== 'none'"
      :conditionType="conditionType"
      :currentAmount="currentAmount"
      :requiredAmount="requiredAmount"
    />

    <div class="flex gap-4">
      <GameTimer :startTime="startTime" />
    </div>
  </div>
</template>
