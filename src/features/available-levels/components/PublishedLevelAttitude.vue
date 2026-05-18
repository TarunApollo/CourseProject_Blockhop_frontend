<script setup>
import { gameVisualTokens } from "@/shared/lib/visualizationTokens";
import { usePublishedLevelAttitude } from "@/features/available-levels/composables/usePublishedLevelAttitude.js";
import AttitudeButton from "./AttitudeButton.vue";

const props = defineProps({
  levelId: { type: [String, Number], required: true },
  attitude: { type: String, default: null },
  likeCount: { type: Number, default: 0 },
  dislikeCount: { type: Number, default: 0 },
});

const tokens = gameVisualTokens;
const {
  attitude,
  likeCount,
  dislikeCount,
  isSaving,
  errorMessage,
  toggleAttitude,
} = usePublishedLevelAttitude(props);
</script>

<template>
  <div class="mt-4 border-t-2 border-black/25 pt-3" @click.stop>
    <div class="flex items-center gap-4" :class="tokens.text.primary">
      <AttitudeButton
        type="like"
        :count="likeCount"
        :active="attitude === 'LIKE'"
        :disabled="isSaving"
        @click="toggleAttitude('LIKE')"
      />

      <AttitudeButton
        type="dislike"
        :count="dislikeCount"
        :active="attitude === 'DISLIKE'"
        :disabled="isSaving"
        @click="toggleAttitude('DISLIKE')"
      />
    </div>

    <p v-if="errorMessage" class="mt-2 text-xs font-bold text-red-700">
      {{ errorMessage }}
    </p>
  </div>
</template>
