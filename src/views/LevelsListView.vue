<script setup>
import { onMounted, watch } from "vue";
import { usePublishedLevels } from "@/features/available-levels/composables/usePublishedLevels.js";
import PublishedLevelsPanel from "@/features/available-levels/components/PublishedLevelsPanel.vue";
import GameBackground from "@/shared/components/GameBackground.vue";
import BackButton from "@/shared/components/BackButton.vue";

const {
  levels,
  isLoading,
  loadError,
  sortBy,
  period,
  minClearRate,
  maxClearRate,
  minAttempts,
  maxAttempts,
  minLikes,
  maxLikes,
  minDislikes,
  maxDislikes,
  description,
  isRandomLoading,
  randomError,
  loadLevels,
  playRandom,
} = usePublishedLevels();

onMounted(loadLevels);

watch([sortBy, period], loadLevels);
</script>

<template>
  <section class="relative min-h-[calc(100vh-2rem)] w-full overflow-hidden">
    <div class="fixed left-4 top-4 sm:left-10 sm:top-10 z-[100]">
      <BackButton to="/home" />
    </div>

    <div
      class="relative z-10 min-h-[calc(100vh-2rem)] px-4 py-6 sm:px-6 lg:px-8"
    >
      <div class="mx-auto flex w-full max-w-none flex-col items-center">
        <div class="flex w-full justify-center">
          <div class="w-full max-w-[600px] sm:max-w-[640px] lg:max-w-[720px]">
            <PublishedLevelsPanel
              :levels="levels"
              :is-loading="isLoading"
              :load-error="loadError"
              :sort-by="sortBy"
              :period="period"
              :min-clear-rate="minClearRate"
              :max-clear-rate="maxClearRate"
              :min-attempts="minAttempts"
              :max-attempts="maxAttempts"
              :min-likes="minLikes"
              :max-likes="maxLikes"
              :min-dislikes="minDislikes"
              :max-dislikes="maxDislikes"
              :description="description"
              :is-random-loading="isRandomLoading"
              :random-error="randomError"
              @update:sort-by="sortBy = $event"
              @update:period="period = $event"
              @update:min-clear-rate="minClearRate = $event"
              @update:max-clear-rate="maxClearRate = $event"
              @update:min-attempts="minAttempts = $event"
              @update:max-attempts="maxAttempts = $event"
              @update:min-likes="minLikes = $event"
              @update:max-likes="maxLikes = $event"
              @update:min-dislikes="minDislikes = $event"
              @update:max-dislikes="maxDislikes = $event"
              @update:description="description = $event"
              @search="loadLevels"
              @play-random="playRandom"
              @retry="loadLevels"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
