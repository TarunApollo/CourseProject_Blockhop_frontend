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
const likeCount = ref(0);
const dislikeCount = ref(0);
const userAttitude = ref(null);
const isSavingAttitude = ref(false);

watch(
  () => [
    props.level.id,
    props.level.likes,
    props.level.dislikes,
    props.level.userAttitude,
    props.level.attitude,
  ],
  () => {
    likeCount.value = Number(props.level.likes ?? 0);
    dislikeCount.value = Number(props.level.dislikes ?? 0);
    userAttitude.value = props.level.userAttitude ?? props.level.attitude ?? null;
  },
  { immediate: true },
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
  if (isSavingAttitude.value) {
    return;
  }

  const levelId = String(props.level.id ?? "").trim();

  if (!levelId) {
    return;
  }

  isSavingAttitude.value = true;

  try {
    if (userAttitude.value === nextAttitude) {
      await clearPublishedLevelAttitude(levelId);

      if (nextAttitude === "like") {
        likeCount.value = Math.max(0, likeCount.value - 1);
      } else if (nextAttitude === "dislike") {
        dislikeCount.value = Math.max(0, dislikeCount.value - 1);
      }

      userAttitude.value = null;
      return;
    }

    const counts = await setPublishedLevelAttitude(levelId, nextAttitude);
    likeCount.value = Number(counts.likes ?? likeCount.value);
    dislikeCount.value = Number(counts.dislikes ?? dislikeCount.value);
    userAttitude.value = nextAttitude;
  } finally {
    isSavingAttitude.value = false;
  }
}

function buttonClass(isActive) {
  return [
    "h-11 w-11 shrink-0 border-2 border-black text-lg font-black uppercase leading-none transition-transform duration-75",
    isActive ? "bg-black text-white" : "bg-transparent text-black",
    "hover:-translate-y-[1px] active:translate-y-[1px]",
    isSavingAttitude.value ? "cursor-wait opacity-75" : "cursor-pointer",
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

    <div class="mt-4 border-t-2 border-black/25 pt-3" @click.stop>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center justify-between gap-3 sm:justify-start">
          <div class="flex items-center gap-2">
            <span :class="[tokens.text.secondary, 'text-xs font-bold uppercase tracking-[0.12em]']">
              Likes
            </span>
            <span :class="[tokens.text.primary, 'min-w-8 text-right font-number-prop text-base font-black']">
              {{ likeCount }}
            </span>
          </div>
          <button
            :class="buttonClass(userAttitude === 'like')"
            type="button"
            aria-label="Like level"
            :aria-pressed="userAttitude === 'like'"
            :disabled="isSavingAttitude"
            @click.stop="updateAttitude('like')"
          >
            <span aria-hidden="true">👍</span>
          </button>
        </div>

        <div class="flex items-center justify-between gap-3 sm:justify-start">
          <div class="flex items-center gap-2">
            <span :class="[tokens.text.secondary, 'text-xs font-bold uppercase tracking-[0.12em]']">
              Dislikes
            </span>
            <span :class="[tokens.text.primary, 'min-w-8 text-right font-number-prop text-base font-black']">
              {{ dislikeCount }}
            </span>
          </div>
          <button
            :class="buttonClass(userAttitude === 'dislike')"
            type="button"
            aria-label="Dislike level"
            :aria-pressed="userAttitude === 'dislike'"
            :disabled="isSavingAttitude"
            @click.stop="updateAttitude('dislike')"
          >
            <span aria-hidden="true">👎</span>
          </button>
        </div>
      </div>
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
