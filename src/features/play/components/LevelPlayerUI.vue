<script setup>
import Button from "@/shared/components/Button.vue";

const props = defineProps({
  isPaused: { type: Boolean, default: false },
  showVictoryPopup: { type: Boolean, default: false },
  attemptSubmitError: { type: String, default: "" },
});

const emit = defineEmits(["continue", "quit", "restart", "exit"]);
</script>

<template>
  <div
    v-if="isPaused || showVictoryPopup"
    class="absolute inset-0 z-50 flex items-center justify-center bg-overlay px-4"
  >
    <div
      class="bg-black border-[6px] border-white p-8 sm:p-12 flex flex-col gap-8 min-w-[20rem] max-w-full text-center shadow-2xl"
    >
      <template v-if="isPaused">
        <h2 class="text-5xl font-bold text-white uppercase tracking-tighter">
          paused
        </h2>
        <div class="flex flex-col gap-4">
          <Button class="text-xl py-4" @click="emit('continue')"
            >continue</Button
          >
          <Button class="text-xl py-4" @click="emit('quit')">quit</Button>
        </div>
      </template>

      <template v-else-if="showVictoryPopup">
        <h2
          class="text-4xl sm:text-5xl font-bold text-game-primary leading-tight uppercase tracking-tighter"
        >
          YOU WIN!
        </h2>
        <div class="flex flex-col gap-4">
          <Button class="text-xl py-4" @click="emit('restart')">restart</Button>
          <Button class="text-xl py-4" @click="emit('exit')">exit</Button>
        </div>
      </template>
    </div>
  </div>

  <div
    v-if="attemptSubmitError"
    class="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-status-error border-2 border-white p-2 text-sm font-bold animate-bounce"
  >
    {{ attemptSubmitError }}
  </div>
</template>
