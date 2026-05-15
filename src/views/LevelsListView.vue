<script setup>
import { onMounted, watch, watchEffect } from "vue";
import { usePublishedLevels } from "@/features/available-levels/composables/usePublishedLevels.js";
import PublishedLevelsPanel from "@/features/available-levels/components/PublishedLevelsPanel.vue";
import GameBackground from "@/shared/components/GameBackground.vue";
import BackButton from "@/shared/components/BackButton.vue";
import { useFavoritesStore } from "@/stores/favorites";

const { levels, isLoading, loadError, sortBy, period, loadLevels } =
  usePublishedLevels();

const favoritesStore = useFavoritesStore();

onMounted(() => {
  loadLevels();
  favoritesStore.hydrate().catch(() => {});
});

function refreshLevels() {
    loadLevels();
}

watch([sortBy, period], refreshLevels);
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
              @update:sort-by="sortBy = $event"
              @update:period="period = $event"
              @retry="loadLevels"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
