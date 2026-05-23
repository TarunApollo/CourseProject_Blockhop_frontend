<script setup>
import { computed, ref } from "vue";
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
  minLikes: { type: [String, Number], default: "" },
  maxLikes: { type: [String, Number], default: "" },
  minDislikes: { type: [String, Number], default: "" },
  maxDislikes: { type: [String, Number], default: "" },
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
  "update:minLikes",
  "update:maxLikes",
  "update:minDislikes",
  "update:maxDislikes",
  "update:description",
  "playRandom",
  "retry",
  "clearAdvancedFilters",
]);

const tokens = gameVisualTokens;
const showAdvancedFilters = ref(false);

const inputClass = [
  tokens.backgrounds.backButton,
  "w-full min-w-0 px-2 py-2 text-sm font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
];

const textInputClass = [
  tokens.backgrounds.backButton,
  "w-full min-w-0 px-3 py-2 text-sm font-bold outline-none",
];

const selectClass = [
  tokens.backgrounds.backButton,
  tokens.backgrounds.backButtonHover,
  "w-full cursor-pointer appearance-none px-3 py-2 text-sm font-bold outline-none",
];

const labelClass = [
  tokens.text.secondary,
  "text-xs font-bold uppercase tracking-[0.12em]",
];

const activeAdvancedFilterCount = computed(
  () =>
    [
      props.minClearRate !== "" || props.maxClearRate !== "",
      props.minAttempts !== "" || props.maxAttempts !== "",
      props.minLikes !== "" || props.maxLikes !== "",
      props.minDislikes !== "" || props.maxDislikes !== "",
    ].filter(Boolean).length,
);

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
  if (max != null && val > max) val = max;
  event.target.value = val;
  emit(emitName, val);
}

function onNumberBlur(event, emitName, { integer = false, peerMin, peerMax } = {}) {
  const raw = event.target.value;
  if (raw === '') return;
  let val = integer ? parseInt(raw, 10) : parseFloat(raw);
  if (isNaN(val)) return;
  if (peerMax !== '' && peerMax != null && val > Number(peerMax)) val = Number(peerMax);
  if (peerMin !== '' && peerMin != null && val < Number(peerMin)) val = Number(peerMin);
  event.target.value = val;
  emit(emitName, val);
}
</script>

<template>
  <section :class="[tokens.backgrounds.primaryPanel, 'w-full p-5 sm:p-6']">
    <h2 :class="[tokens.text.primary, 'mb-4 text-2xl sm:text-3xl']">
      Published Levels
    </h2>

    <div
      :class="[
        tokens.backgrounds.emptyPanel,
        'mb-4 flex w-full flex-col gap-4 px-4 py-4',
      ]"
    >
      <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto] lg:items-end">
        <div class="flex flex-col gap-1">
          <label :class="labelClass">
            Sort By
          </label>
          <select
            :value="sortBy"
            :class="selectClass"
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

        <div v-if="sortBy === 'POPULARITY'" class="flex flex-col gap-1">
          <label :class="labelClass">
            Period
          </label>
          <select
            :value="period"
            :class="selectClass"
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

        <div v-else class="hidden lg:block"></div>

        <div class="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
          <label :class="labelClass">
            Description
          </label>
          <input
            type="text"
            placeholder="Search words..."
            maxlength="300"
            :value="description"
            :class="textInputClass"
            @input="emit('update:description', $event.target.value)"
          />
        </div>

        <div class="flex items-end sm:col-span-2 lg:col-span-1">
          <button
            :class="[
              tokens.backgrounds.backButton,
              tokens.backgrounds.backButtonHover,
              'w-full px-4 py-2 text-sm font-bold whitespace-nowrap sm:w-auto',
              isRandomLoading ? 'pointer-events-none opacity-60' : '',
            ]"
            type="button"
            :disabled="isRandomLoading"
            @click="emit('playRandom')"
          >
            {{ isRandomLoading ? "Loading..." : "Play Random" }}
          </button>
        </div>
      </div>

      <div class="flex flex-col border-t-2 border-[#6AA85E] pt-3">
        <div class="flex items-center justify-between gap-2">
          <button
            :class="[tokens.text.primary, 'text-sm font-bold hover:opacity-80']"
            type="button"
            @click="showAdvancedFilters = !showAdvancedFilters"
          >
            Advanced
            <span
              v-if="activeAdvancedFilterCount > 0"
              :class="[tokens.backgrounds.statusBadge, 'ml-1 rounded px-1.5 py-0.5 text-xs no-underline']"
            >
              {{ activeAdvancedFilterCount }}
            </span>
            <span class="ml-1 text-xs">{{ showAdvancedFilters ? '▲' : '▼' }}</span>
          </button>

          <button
            v-if="activeAdvancedFilterCount > 0"
            :class="[tokens.text.secondary, 'text-xs font-bold underline decoration-dotted underline-offset-2 hover:opacity-80']"
            type="button"
            @click="emit('clearAdvancedFilters')"
          >
            Clear All
          </button>
        </div>

        <div
          v-if="showAdvancedFilters"
          class="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4"
        >
          <div class="flex flex-col gap-1">
            <span :class="labelClass">
              Clear Rate %
            </span>
            <div class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <input
                type="number"
                min="0"
                :max="maxClearRate !== '' ? maxClearRate : 100"
                placeholder="Min"
                :value="minClearRate"
                :class="inputClass"
                @keydown="(e) => e.key === '-' && e.preventDefault()"
                @input="onNumberInput($event, 'update:minClearRate', { max: 100 })"
                @blur="onNumberBlur($event, 'update:minClearRate', { peerMax: maxClearRate })"
              />
              <span :class="[tokens.text.secondary, 'text-xs font-bold']">to</span>
              <input
                type="number"
                :min="minClearRate !== '' ? minClearRate : 0"
                max="100"
                placeholder="Max"
                :value="maxClearRate"
                :class="inputClass"
                @keydown="(e) => e.key === '-' && e.preventDefault()"
                @input="onNumberInput($event, 'update:maxClearRate', { max: 100 })"
                @blur="onNumberBlur($event, 'update:maxClearRate', { max: 100, peerMin: minClearRate })"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <span :class="labelClass">
              Attempts
            </span>
            <div class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <input
                type="number"
                min="0"
                :max="maxAttempts !== '' ? maxAttempts : 1000000"
                placeholder="Min"
                :value="minAttempts"
                :class="inputClass"
                @keydown="(e) => e.key === '-' && e.preventDefault()"
                @input="onNumberInput($event, 'update:minAttempts', { max: 1000000, integer: true })"
                @blur="onNumberBlur($event, 'update:minAttempts', { integer: true, peerMax: maxAttempts })"
              />
              <span :class="[tokens.text.secondary, 'text-xs font-bold']">to</span>
              <input
                type="number"
                :min="minAttempts !== '' ? minAttempts : 0"
                max="1000000"
                placeholder="Max"
                :value="maxAttempts"
                :class="inputClass"
                @keydown="(e) => e.key === '-' && e.preventDefault()"
                @input="onNumberInput($event, 'update:maxAttempts', { max: 1000000, integer: true })"
                @blur="onNumberBlur($event, 'update:maxAttempts', { integer: true, peerMin: minAttempts })"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <span :class="labelClass">
              Likes
            </span>
            <div class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <input
                type="number"
                min="0"
                :max="maxLikes !== '' ? maxLikes : 1000000"
                placeholder="Min"
                :value="minLikes"
                :class="inputClass"
                @keydown="(e) => e.key === '-' && e.preventDefault()"
                @input="onNumberInput($event, 'update:minLikes', { max: 1000000, integer: true })"
                @blur="onNumberBlur($event, 'update:minLikes', { integer: true, peerMax: maxLikes })"
              />
              <span :class="[tokens.text.secondary, 'text-xs font-bold']">to</span>
              <input
                type="number"
                :min="minLikes !== '' ? minLikes : 0"
                max="1000000"
                placeholder="Max"
                :value="maxLikes"
                :class="inputClass"
                @keydown="(e) => e.key === '-' && e.preventDefault()"
                @input="onNumberInput($event, 'update:maxLikes', { max: 1000000, integer: true })"
                @blur="onNumberBlur($event, 'update:maxLikes', { integer: true, peerMin: minLikes })"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <span :class="labelClass">
              Dislikes
            </span>
            <div class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <input
                type="number"
                min="0"
                :max="maxDislikes !== '' ? maxDislikes : 1000000"
                placeholder="Min"
                :value="minDislikes"
                :class="inputClass"
                @keydown="(e) => e.key === '-' && e.preventDefault()"
                @input="onNumberInput($event, 'update:minDislikes', { max: 1000000, integer: true })"
                @blur="onNumberBlur($event, 'update:minDislikes', { integer: true, peerMax: maxDislikes })"
              />
              <span :class="[tokens.text.secondary, 'text-xs font-bold']">to</span>
              <input
                type="number"
                :min="minDislikes !== '' ? minDislikes : 0"
                max="1000000"
                placeholder="Max"
                :value="maxDislikes"
                :class="inputClass"
                @keydown="(e) => e.key === '-' && e.preventDefault()"
                @input="onNumberInput($event, 'update:maxDislikes', { max: 1000000, integer: true })"
                @blur="onNumberBlur($event, 'update:maxDislikes', { integer: true, peerMin: minDislikes })"
              />
            </div>
          </div>
        </div>
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

    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <PublishedLevelCard
        v-for="level in levels"
        :key="level.id"
        :level="level"
      />
    </div>
  </section>
</template>
