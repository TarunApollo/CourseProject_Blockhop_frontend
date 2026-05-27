<script setup>
import Button from "@/shared/components/Button.vue";
import ToggleSwitch from "@/shared/components/ToggleSwitch.vue";
import { PLAYER_SKINS } from "@/components/levelPlayer/phaser/phaserConstants";

const props = defineProps({
  isPaused: { type: Boolean, default: false },
  showVictoryPopup: { type: Boolean, default: false },
  attemptSubmitError: { type: String, default: "" },
  replayVerificationWarning: { type: String, default: "" },
  playerSkin: { type: String, default: "green" },
  hasGhost: { type: Boolean, default: false },
  ghostVisible: { type: Boolean, default: true },
  ghostToggleAvailable: { type: Boolean, default: false },
});

const emit = defineEmits([
  "continue",
  "quit",
  "restart",
  "exit",
  "update:playerSkin",
  "toggle-ghost",
]);
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
          <label class="flex items-center justify-between gap-4 text-left text-xl font-bold uppercase">
            Skin
            <select
              class="bg-black border-2 border-white px-3 py-2 text-white"
              :value="playerSkin"
              @change="emit('update:playerSkin', $event.target.value)"
            >
              <option v-for="skin in PLAYER_SKINS" :key="skin" :value="skin">
                {{ skin }}
              </option>
            </select>
          </label>
          <div v-if="hasGhost && ghostToggleAvailable" class="flex items-center justify-between gap-4">
            <span class="text-xl font-bold uppercase text-white">Ghost</span>
            <ToggleSwitch
              size="lg"
              :modelValue="ghostVisible"
              @update:modelValue="emit('toggle-ghost')"
            />
          </div>
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
    v-if="replayVerificationWarning"
    class="anticheat-warning absolute inset-x-3 top-20 z-[70] mx-auto max-w-5xl border-[6px] border-white bg-status-error px-4 py-5 text-center font-number-prop font-bold uppercase text-white shadow-2xl sm:inset-x-8 sm:top-24 sm:px-8 sm:py-7"
  >
    <div class="text-xl leading-tight sm:text-4xl">
      {{ replayVerificationWarning }}
    </div>
    <div class="mt-4 text-[0.65rem] leading-relaxed sm:text-base">
      This attempt is invalid unless verification clears it.
    </div>
  </div>

  <div
    v-else-if="attemptSubmitError"
    class="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-status-error border-2 border-white p-2 text-sm font-bold animate-bounce"
  >
    {{ attemptSubmitError }}
  </div>
</template>
