<script setup>
import { watch } from "vue";
import { gameVisualTokens } from "@/shared/lib/visualizationTokens";
import {
  PUBLISHED_LEVEL_SORT_OPTIONS,
  PUBLISHED_LEVEL_PERIOD_OPTIONS,
  PERIOD_LABELS,
} from "@/features/available-levels/lib/publishedLevelsContract.js";
import PublishedLevelCard from "./PublishedLevelCard.vue";

const props = defineProps({
  levels: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  loadError: { type: String, default: "" },
  sortBy: { type: String, required: true },
  period: { type: String, required: true },
});

const emit = defineEmits(["update:sortBy", "update:period", "retry"]);

const tokens = gameVisualTokens;

function onSortChange(val) {
  emit("update:sortBy", val);
  if (val === "CLEAR_RATE") {
    emit("update:period", "ALL_TIME");
  }
}

function onPeriodChange(val) {
  emit("update:period", val);
}
</script>

<template>
  <section :class="[tokens.backgrounds.primaryPanel, 'w-full p-5 sm:p-6']">
    <div class="mb-4">
      <p :class="[tokens.text.accent, 'text-sm uppercase tracking-[0.25em]']">
        Browse
      </p>
      <h2 :class="[tokens.text.primary, 'mt-2 text-3xl']">
        Published Levels
      </h2>
    </div>

    <div
      :class="[
        tokens.backgrounds.emptyPanel,
        'mb-4 flex w-full items-center justify-center gap-4 px-4 py-3',
      ]"
    >
      <div class="flex items-center gap-2">
        <label
          :class="[tokens.text.secondary, 'text-sm font-bold uppercase tracking-[0.12em]']"
        >
          Sort
        </label>
        <select
          :value="sortBy"
          :class="[
            tokens.backgrounds.backButton,
            tokens.backgrounds.backButtonHover,
            'cursor-pointer appearance-none px-3 py-1.5 text-sm font-bold outline-none',
          ]"
          @change="onSortChange($event.target.value)"
        >
          <option
            v-for="opt in PUBLISHED_LEVEL_SORT_OPTIONS"
            :key="opt"
            :value="opt"
          >
            {{ opt === "POPULARITY" ? "Popularity" : "Clear Rate" }}
          </option>
        </select>
      </div>

      <div v-if="sortBy === 'POPULARITY'" class="flex items-center gap-2">
        <label
          :class="[tokens.text.secondary, 'text-sm font-bold uppercase tracking-[0.12em]']"
        >
          Period
        </label>
        <select
          :value="period"
          :class="[
            tokens.backgrounds.backButton,
            tokens.backgrounds.backButtonHover,
            'cursor-pointer appearance-none px-3 py-1.5 text-sm font-bold outline-none',
          ]"
          @change="onPeriodChange($event.target.value)"
        >
          <option
            v-for="opt in PUBLISHED_LEVEL_PERIOD_OPTIONS"
            :key="opt"
            :value="opt"
          >
            {{ PERIOD_LABELS[opt] }}
          </option>
        </select>
      </div>
    </div>

    <div
      v-if="isLoading"
      :class="[
        tokens.backgrounds.emptyPanel,
        'min-h-[220px] w-full flex items-center justify-center px-4',
      ]"
    >
      <p :class="[tokens.text.secondary, 'text-center text-base']">
        Loading levels...
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
        No published levels available.
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
