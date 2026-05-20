<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps({
  startTime: { type: Number, default: Date.now() },
});

const elapsedMs = ref(0);
let interval = null;

const formatTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

onMounted(() => {
  interval = setInterval(() => {
    elapsedMs.value = Date.now() - props.startTime;
  }, 1000);
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});
</script>

<template>
  <div
    class="flex items-center justify-center h-[52px] bg-hud-pill border-2 border-white px-4 shadow-hud"
  >
    <span
      class="font-number-prop text-2xl sm:text-3xl leading-none text-white"
    >
      {{ formatTime(elapsedMs) }}
    </span>
  </div>
</template>
