import { ref, computed } from 'vue'
import { useFavoritesStore } from '@/stores/favorites'

export function useFavorites() {
    const store = useFavoritesStore()
    const favorites = computed(() => store.favorites)
    const isLoading = ref(false)
    const loadError = ref('')

    async function loadFavorites() {
        isLoading.value = true
        loadError.value = ''
        try {
            await store.refresh()
        } catch (error) {
            loadError.value =
                error instanceof Error ? error.message : 'Failed to load favorites.'
        } finally {
            isLoading.value = false
        }
    }

    return { favorites, isLoading, loadError, loadFavorites }
}