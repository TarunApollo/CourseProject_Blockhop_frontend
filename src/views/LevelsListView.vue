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
    <div class="absolute left-4 top-4 sm:left-10 sm:top-10 z-[100]">
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
              :is-random-loading="isRandomLoading"
              :random-error="randomError"
              @update:sort-by="sortBy = $event"
              @update:period="period = $event"
              @update:min-clear-rate="minClearRate = $event"
              @update:max-clear-rate="maxClearRate = $event"
              @update:min-attempts="minAttempts = $event"
              @update:max-attempts="maxAttempts = $event"
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
