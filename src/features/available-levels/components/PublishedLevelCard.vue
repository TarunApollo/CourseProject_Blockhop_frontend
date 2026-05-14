<script setup>
import { onBeforeUnmount, ref, watch } from "vue";
import { gameVisualTokens } from "@/shared/lib/visualizationTokens";
import LevelPreview from "@/features/profile/components/LevelPreview.vue";
import PublishedLevelDetail from "./PublishedLevelDetail.vue";
import {
  clearPublishedLevelAttitude,
  setPublishedLevelAttitude,
} from "@/features/available-levels/lib/publishedLevelAttitudeApi.js";

const props = defineProps({
  level: { type: Object, required: true },
});

const tokens = gameVisualTokens;
const showDetail = ref(false);
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
  () => props.level.id,
  (newId) => {
    if (lastLevelId.value !== newId) {
      lastLevelId.value = newId;
      userAttitude.value = normalizeAttitude(
        props.level.userAttitude ?? props.level.attitude ?? null,
      );
    }
  },
  { immediate: true },
);

watch(
  () => props.level.userAttitude ?? props.level.attitude,
  (val) => {
    if (lastLevelId.value === props.level.id && !isSavingAttitude.value) {
      if (val !== undefined && val !== null) {
        userAttitude.value = normalizeAttitude(val);
      }
    }
  },
);

function openDetail() {
  showDetail.value = true;
  document.addEventListener("keydown", onEscape);
}

function closeDetail() {
  showDetail.value = false;
  document.removeEventListener("keydown", onEscape);
}

function onEscape(e) {
  if (e.key === "Escape" && showDetail.value) {
    closeDetail();
    e.preventDefault();
  }
}

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
    "inline-flex items-center justify-center p-1.5 rounded transition-all duration-100",
    isActive ? "bg-green-700" : "bg-transparent",
    isSavingAttitude.value ? "cursor-wait opacity-60" : "cursor-pointer hover:opacity-80",
  ];
}

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onEscape);
});
</script>

<template>
  <article
    :class="[tokens.backgrounds.secondaryPanel, 'relative cursor-pointer p-4']"
    @click="openDetail"
  >
    <LevelPreview
      :world-layer="level.worldLayer"
      :object-layer="level.objectLayer"
    />

    <h3 :class="[tokens.text.primary, 'min-w-0 truncate text-2xl']">
      {{ level.title || "Untitled Level" }}
    </h3>

    <p :class="[tokens.text.accent, 'mt-2 text-sm']">
      by {{ level.creatorName || "Unknown" }}
    </p>

    <div class="mt-2 flex items-center gap-4">
      <div class="flex items-center gap-1.5">
        <span :class="[tokens.text.secondary, 'text-xs font-bold']">Plays:</span>
        <span :class="[tokens.text.primary, 'text-[0.6rem] font-bold font-number-prop']">{{ level.playCount }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span :class="[tokens.text.secondary, 'text-xs font-bold']">Clear Rate:</span>
        <span :class="[tokens.text.primary, 'text-[0.6rem] font-bold font-number-prop']">{{ (level.clearRate * 100).toFixed(1) }}%</span>
      </div>
    </div>

    <p :class="[tokens.text.secondary, 'mt-2 min-h-12 text-base']">
      {{ level.description || "No description provided." }}
    </p>

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
          stroke-width="1.5"
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
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M17 14V2M9 18.12L10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
        </svg>
      </button>
    </div>
  </article>

  <Teleport to="body">
    <PublishedLevelDetail
      v-if="showDetail"
      :level="level"
      @close="closeDetail"
    />
  </Teleport>
</template>

<style scoped>
button:disabled {
  pointer-events: none;
}
</style>