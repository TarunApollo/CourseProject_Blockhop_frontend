<script setup>
import { ref, watch } from "vue";
import { gameVisualTokens } from "@/shared/lib/visualizationTokens";
import {
  clearPublishedLevelAttitude,
  setPublishedLevelAttitude,
} from "@/features/available-levels/lib/publishedLevelAttitude.js";

const props = defineProps({
  level: { type: Object, required: true },
});

const tokens = gameVisualTokens;
const userAttitude = ref(null);
const isSavingAttitude = ref(false);
const lastLevelId = ref(null);

function normalizeAttitude(attitude) {
  if (attitude === "LIKE" || attitude === "DISLIKE") return attitude;
  if (attitude === "like") return "LIKE";
  if (attitude === "dislike") return "DISLIKE";
  return null;
}

watch(
  () => [props.level.id, props.level.userAttitude ?? props.level.attitude],
  ([newId, newAtt]) => {
    if (lastLevelId.value !== newId) {
      lastLevelId.value = newId;
      userAttitude.value = normalizeAttitude(props.level.userAttitude ?? props.level.attitude ?? null);
      return;
    }

    if (lastLevelId.value === props.level.id && !isSavingAttitude.value) {
      if (newAtt !== undefined && newAtt !== null) {
        userAttitude.value = normalizeAttitude(newAtt);
      }
    }
  },
  { immediate: true },
);

async function updateAttitude(nextAttitude) {
  if (isSavingAttitude.value) return;

  const levelId = String(props.level.id ?? "").trim();
  if (!levelId) return;

  isSavingAttitude.value = true;

  try {
    if (userAttitude.value === nextAttitude) {
      await clearPublishedLevelAttitude(levelId);
      userAttitude.value = null;
      return;
    }

    await setPublishedLevelAttitude(levelId, nextAttitude);
    userAttitude.value = normalizeAttitude(nextAttitude);
  } finally {
    isSavingAttitude.value = false;
  }
}

function iconButtonClass(isActive) {
  return [
    `
    inline-flex items-center justify-center
    p-1.5 rounded
    transition-all duration-100
    outline-none border-none
    focus:outline-none focus:ring-0
    focus-visible:outline-none focus-visible:ring-0
    active:outline-none
    select-none
    `,
    isActive ? "bg-green-700" : "bg-transparent",
    isSavingAttitude.value
      ? "cursor-wait opacity-60"
      : "cursor-pointer hover:opacity-80",
  ];
}
</script>

<template>
    <div class="mt-4 border-t-2 border-black/25 pt-3 flex items-center gap-4" @click.stop>
        <!-- Like button -->
        <button
            :class="iconButtonClass(userAttitude === 'LIKE')"
            type="button"
            aria-label="Like level"
            :aria-pressed="userAttitude === 'LIKE'"
            :disabled="isSavingAttitude"
            @click.stop="updateAttitude('LIKE')"
        >
            <svg
                class="w-8 h-8 transition-opacity duration-100"
                :class="[userAttitude === 'LIKE' ? 'text-white opacity-100' : `${tokens.text.primary} opacity-60`]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
            </svg>
        </button>

        <!-- Dislike button -->
        <button
            :class="iconButtonClass(userAttitude === 'DISLIKE')"
            type="button"
            aria-label="Dislike level"
            :aria-pressed="userAttitude === 'DISLIKE'"
            :disabled="isSavingAttitude"
            @click.stop="updateAttitude('DISLIKE')"
        >
            <svg
                class="w-8 h-8 transition-opacity duration-100"
                :class="[userAttitude === 'DISLIKE' ? 'text-white opacity-100' : `${tokens.text.primary} opacity-60`]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M17 14V2M9 18.12L10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
            </svg>
        </button>
    </div>
</template>

<style scoped>
button {
  -webkit-tap-highlight-color: transparent;
}

button:focus,
button:focus-visible,
button:active {
  outline: none;
  box-shadow: none;
}

button:disabled {
  pointer-events: none;
}
</style>