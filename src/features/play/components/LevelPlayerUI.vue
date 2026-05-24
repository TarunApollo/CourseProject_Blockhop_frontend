<script setup>
import Button from "@/shared/components/Button.vue";
import ToggleSwitch from "@/shared/components/ToggleSwitch.vue";
import { PLAYER_SKINS } from "@/components/levelPlayer/phaser/phaserConstants";

const props = defineProps({
  isPaused: { type: Boolean, default: false },
  showVictoryPopup: { type: Boolean, default: false },
  attemptSubmitError: { type: String, default: "" },
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
    v-if="attemptSubmitError"
    class="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-status-error border-2 border-white p-2 text-sm font-bold animate-bounce"
  >
    {{ attemptSubmitError }}
  </div>
</template>
