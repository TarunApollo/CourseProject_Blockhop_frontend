import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { fetchFavorites } from "@/features/favorites/lib/fetchFavorites";

export const useFavoritesStore = defineStore("favorites", () => {
    const favorites = ref([]);
    const isHydrated = ref(false);

    const favoriteIds = computed(
        () => new Set(favorites.value.map((level) => level.id)),
    );

    function isFavorite(levelId) {
        return favoriteIds.value.has(levelId);
    }

    async function hydrate() {
        if (isHydrated.value) return;
        favorites.value = await fetchFavorites();
        isHydrated.value = true;
    }

    async function refresh() {
        favorites.value = await fetchFavorites();
        isHydrated.value = true;
    }

    function markFavorited(level) {
        if (!favoriteIds.value.has(level.id)) {
            favorites.value.push(level);
        }
    }

    function unmarkFavorited(levelId) {
        favorites.value = favorites.value.filter((level) => level.id !== levelId);
    }

    return {
        favorites,
        isHydrated,
        favoriteIds,
        isFavorite,
        hydrate,
        refresh,
        markFavorited,
        unmarkFavorited,
    };
});