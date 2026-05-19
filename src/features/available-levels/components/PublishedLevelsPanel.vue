<script setup>
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
  minClearRate: { type: [String, Number], default: "" },
  maxClearRate: { type: [String, Number], default: "" },
  minAttempts: { type: [String, Number], default: "" },
  maxAttempts: { type: [String, Number], default: "" },
  description: { type: String, default: "" },
  isRandomLoading: { type: Boolean, default: false },
  randomError: { type: String, default: "" },
});

const emit = defineEmits([
  "update:sortBy",
  "update:period",
  "update:minClearRate",
  "update:maxClearRate",
  "update:minAttempts",
  "update:maxAttempts",
  "update:description",
  "search",
  "playRandom",
  "retry",
]);

const tokens = gameVisualTokens;

const inputClass = [
  tokens.backgrounds.backButton,
  "w-20 px-2 py-1.5 text-sm font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
];

function onSortChange(val) {
  emit("update:sortBy", val);
  if (val === "CLEAR_RATE") {
    emit("update:period", "ALL_TIME");
  }
}

function onPeriodChange(val) {
  emit("update:period", val);
}

function onNumberInput(event, emitName, { max, integer = false } = {}) {
  const raw = event.target.value;
  if (raw === '') {
    emit(emitName, '');
    return;
  }
  let val = integer ? parseInt(raw, 10) : parseFloat(raw);
  if (isNaN(val)) return;
  if (max != null && val > max) {
    val = max;
    event.target.value = val;
  }
  emit(emitName, val);
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
        'mb-4 flex w-full flex-col gap-3 px-4 py-3',
      ]"
    >
      <div class="flex flex-wrap items-center gap-4">
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

      <div class="flex flex-wrap items-end gap-4">
        <div class="flex flex-col gap-1">
          <span :class="[tokens.text.secondary, 'text-xs font-bold uppercase tracking-[0.12em]']">
            Clear Rate %
          </span>
          <div class="flex items-center gap-1">
            <input
              type="number"
              min="0"
              :max="maxClearRate !== '' ? maxClearRate : 100"
              placeholder="Min"
              :value="minClearRate"
              :class="inputClass"
              @keydown="(e) => e.key === '-' && e.preventDefault()"
              @input="onNumberInput($event, 'update:minClearRate', { max: 100 })"
            />
            <span :class="[tokens.text.secondary, 'text-xs font-bold']">–</span>
            <input
              type="number"
              :min="minClearRate !== '' ? minClearRate : 0"
              max="100"
              placeholder="Max"
              :value="maxClearRate"
              :class="inputClass"
              @keydown="(e) => e.key === '-' && e.preventDefault()"
              @input="onNumberInput($event, 'update:maxClearRate', { max: 100 })"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <span :class="[tokens.text.secondary, 'text-xs font-bold uppercase tracking-[0.12em]']">
            Attempts
          </span>
          <div class="flex items-center gap-1">
            <input
              type="number"
              min="0"
              :max="maxAttempts !== '' ? maxAttempts : 1000000"
              placeholder="Min"
              :value="minAttempts"
              :class="inputClass"
              @keydown="(e) => e.key === '-' && e.preventDefault()"
              @input="onNumberInput($event, 'update:minAttempts', { max: 1000000, integer: true })"
            />
            <span :class="[tokens.text.secondary, 'text-xs font-bold']">–</span>
            <input
              type="number"
              :min="minAttempts !== '' ? minAttempts : 0"
              max="1000000"
              placeholder="Max"
              :value="maxAttempts"
              :class="inputClass"
              @keydown="(e) => e.key === '-' && e.preventDefault()"
              @input="onNumberInput($event, 'update:maxAttempts', { max: 1000000, integer: true })"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <span :class="[tokens.text.secondary, 'text-xs font-bold uppercase tracking-[0.12em]']">
            Description
          </span>
          <input
            type="text"
            placeholder="Words…"
            maxlength="300"
            :value="description"
            :class="[
              tokens.backgrounds.backButton,
              'w-36 px-2 py-1.5 text-sm font-bold outline-none',
            ]"
            @input="emit('update:description', $event.target.value)"
          />
        </div>

        <button
          :class="[
            tokens.backgrounds.backButton,
            tokens.backgrounds.backButtonHover,
            'px-4 py-1.5 text-sm font-bold',
          ]"
          type="button"
          @click="emit('search')"
        >
          Search
        </button>

        <button
          :class="[
            tokens.backgrounds.backButton,
            tokens.backgrounds.backButtonHover,
            'px-4 py-1.5 text-sm font-bold',
            isRandomLoading ? 'opacity-60 pointer-events-none' : '',
          ]"
          type="button"
          :disabled="isRandomLoading"
          @click="emit('playRandom')"
        >
          {{ isRandomLoading ? "Loading…" : "Play Random" }}
        </button>
      </div>

      <p v-if="randomError" :class="[tokens.text.primary, 'text-sm font-bold']">
        {{ randomError }}
      </p>
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
