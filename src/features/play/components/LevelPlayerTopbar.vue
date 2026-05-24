<script setup>
import ClearConditionDisplay from "./ClearConditionDisplay.vue";
import GameTimer from "./GameTimer.vue";

defineProps({
  mapData: Object,
  conditionType: { type: String, default: "none" },
  currentAmount: { type: Number, default: 0 },
  requiredAmount: { type: Number, default: 0 },
  elapsedMs: Number,
});

defineEmits(["pause"]);
</script>

<template>
  <div
    class="flex items-center justify-center bg-hud-bg border-b-4 border-hud-border h-[72px] gap-4 w-full shrink-0 relative px-4"
  >
    <button
      type="button"
      class="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center ui-btn text-xl"
      aria-label="Pause"
      @click="$emit('pause')"
    >
      ⏸
    </button>
    <ClearConditionDisplay
      v-if="mapData && conditionType !== 'none'"
      :conditionType="conditionType"
      :currentAmount="currentAmount"
      :requiredAmount="requiredAmount"
    />

    <div class="flex gap-4">
      <GameTimer :elapsedMs="elapsedMs" />
    </div>
  </div>
</template>
