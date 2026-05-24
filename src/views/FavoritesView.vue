<script setup>
import { onMounted, onUnmounted } from "vue";
import { useFavorites } from "@/features/favorites/composables/useFavorites";
import FavoritesPanel from "@/features/favorites/components/FavoritesPanel.vue";
import BackButton from "@/shared/components/BackButton.vue";

const { favorites, isLoading, loadError, loadFavorites } = useFavorites();

function onPageShow(e) {
  if (e.persisted) {
    loadFavorites();
  }
}

onMounted(() => {
  loadFavorites();
  window.addEventListener("pageshow", onPageShow);
});

onUnmounted(() => {
  window.removeEventListener("pageshow", onPageShow);
});
</script>

<template>
  <section class="relative min-h-[calc(100vh-2rem)] w-full overflow-hidden">
    <div class="absolute left-4 top-4 sm:left-10 sm:top-10 z-[100]">
      <BackButton to="/profile" />
    </div>

    <div
        class="relative z-10 min-h-[calc(100vh-2rem)] px-4 py-6 sm:px-6 lg:px-8"
    >
      <div class="mx-auto flex w-full max-w-none flex-col items-center">
        <div class="flex w-full justify-center">
          <div class="w-full max-w-[600px] sm:max-w-[640px] lg:max-w-[720px]">
            <FavoritesPanel
                :levels="favorites"
                :is-loading="isLoading"
                :load-error="loadError"
                @retry="loadFavorites"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>