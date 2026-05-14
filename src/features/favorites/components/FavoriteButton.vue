<script setup>
import { gameVisualTokens } from "@/shared/lib/visualizationTokens";
import { useFavoriteToggle } from "@/features/favorites/composables/useFavoriteToggle";
import HeartIcon from "@/features/favorites/components/HeartIcon.vue";

const props = defineProps({
  level: { type: Object, required: true },
});

const tokens = gameVisualTokens;
const { isFavorite, isSubmitting, handleToggle } = useFavoriteToggle(props.level);
</script>

<template>
  <button
      type="button"
      :disabled="isSubmitting"
      :aria-pressed="isFavorite"
      :title="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
      :class="[
      tokens.backgrounds.backButton,
      tokens.backgrounds.backButtonHover,
      'h-9 w-9 flex items-center justify-center',
    ]"
      @click="handleToggle"
  >
    <span :class="isFavorite ? 'text-red-600' : tokens.text.secondary">
      <HeartIcon :filled="isFavorite" />
    </span>
  </button>
</template>