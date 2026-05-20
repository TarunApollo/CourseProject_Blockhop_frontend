<script setup>
import { gameVisualTokens } from "@/shared/lib/visualizationTokens";
import PublishedLevelCard from "@/features/available-levels/components/PublishedLevelCard.vue";

defineProps({
  levels: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  loadError: { type: String, default: "" },
});

const emit = defineEmits(["retry"]);

const tokens = gameVisualTokens;
</script>

<template>
  <section :class="[tokens.backgrounds.primaryPanel, 'w-full p-5 sm:p-6']">
    <div class="mb-4">
      <p :class="[tokens.text.accent, 'text-sm uppercase tracking-[0.25em]']">
        Collection
      </p>
      <h2 :class="[tokens.text.primary, 'mt-2 text-3xl']">
        Favorite Levels
      </h2>
    </div>

    <div
        v-if="isLoading"
        :class="[
        tokens.backgrounds.emptyPanel,
        'min-h-[220px] w-full flex items-center justify-center px-4',
      ]"
    >
      <p :class="[tokens.text.secondary, 'text-center text-base']">
        Loading favorites...
      </p>
    </div>

    <div
        v-else-if="loadError"
        :class="[
        tokens.backgrounds.emptyPanel,
        'min-h-[220px] w-full flex flex-col items-center justify-center gap-3 px-4',
      ]"
    >
      <p :class="[tokens.text.secondary, 'text-center text-base']">
        {{ loadError }}
      </p>
      <button
          :class="[
          tokens.backgrounds.backButton,
          tokens.backgrounds.backButtonHover,
          'px-4 py-2 text-sm font-bold',
        ]"
          type="button"
          @click="emit('retry')"
      >
        Retry
      </button>
    </div>

    <div
        v-else-if="levels.length === 0"
        :class="[
        tokens.backgrounds.emptyPanel,
        'min-h-[220px] w-full flex items-center justify-center px-4',
      ]"
    >
      <p :class="[tokens.text.secondary, 'text-center text-base']">
        No favorite levels yet.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <PublishedLevelCard
          v-for="level in levels"
          :key="level.id"
          :level="level"
      />
    </div>
  </section>
</template>