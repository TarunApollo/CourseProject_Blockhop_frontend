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

const periodSelectClass = [
  tokens.backgrounds.backButton,
  tokens.backgrounds.backButtonHover,
  "min-w-[130px] cursor-pointer appearance-none px-2.5 py-1 text-xs font-bold outline-none",
];

const sortButtonBaseClass =
  "px-2.5 py-1 text-xs font-bold whitespace-nowrap transition-opacity";

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

function getSortButtonClass(active) {
  return [
    active
      ? tokens.backgrounds.backButton
      : tokens.backgrounds.secondaryPanel,
    active ? tokens.backgrounds.backButtonHover : "hover:opacity-90",
    sortButtonBaseClass,
  ];
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
  <section :class="[tokens.backgrounds.primaryPanel, 'relative w-full p-5 pb-6 sm:p-6 sm:pb-8']">
    <h2 :class="[tokens.text.primary, 'mb-4 text-2xl sm:text-3xl']">
      Published Levels
    </h2>

    <div
      :class="[
        tokens.backgrounds.emptyPanel,
        'mb-4 flex w-full flex-col gap-4 px-4 py-4',
      ]"
    >
      <div class="flex flex-col gap-1">
        <div class="flex flex-col gap-1">
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

    <div class="mb-8 flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <span :class="[tokens.text.secondary, 'text-xs font-bold uppercase tracking-[0.12em]']">
          Sort
        </span>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="opt in PUBLISHED_LEVEL_SORT_OPTIONS"
            :key="opt"
            type="button"
            :class="getSortButtonClass(sortBy === opt)"
            @click="onSortChange(opt)"
          >
            {{ opt === "POPULARITY" ? "Popularity" : "Clear Rate" }}
          </button>
        </div>
      </div>

      <div
        v-if="sortBy === 'POPULARITY'"
        class="flex items-center gap-2"
      >
        <label :class="[tokens.text.secondary, 'text-xs font-bold uppercase tracking-[0.12em]']">
          Period
        </label>
        <select
          :value="period"
          :class="periodSelectClass"
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

    <div v-else class="relative">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PublishedLevelCard
          v-for="level in levels"
          :key="level.id"
          :level="level"
        />
      </div>

      <button
        :class="[
          'absolute bottom-0 right-0 z-10 cursor-pointer bg-transparent hover:opacity-70',
          isRandomLoading ? 'pointer-events-none opacity-60' : '',
        ]"
        type="button"
        :disabled="isRandomLoading"
        :aria-label="isRandomLoading ? 'Loading random level' : 'Play random level'"
        :title="isRandomLoading ? 'Loading random level' : 'Play random level'"
        @click="emit('playRandom')"
      >
        <svg
          viewBox="0 0 1024 1024"
          class="h-[3.825rem] w-[3.825rem]"
          fill="#3a7d32"
          aria-hidden="true"
        >
          <path d="M896 704C896 720.213333 887.04 734.293333 873.386667 741.546667L536.32 930.986667C529.493333 936.106667 520.96 938.666667 512 938.666667 503.04 938.666667 494.506667 936.106667 487.68 930.986667L150.613333 741.546667C136.96 734.293333 128 720.213333 128 704L128 320C128 303.786667 136.96 289.706667 150.613333 282.453333L487.68 93.013333C494.506667 87.893333 503.04 85.333333 512 85.333333 520.96 85.333333 529.493333 87.893333 536.32 93.013333L873.386667 282.453333C887.04 289.706667 896 303.786667 896 320L896 704M234.666667 610.986667C211.2 597.333333 192 605.866667 192 629.333333 192 652.8 211.2 682.666667 234.666667 696.32 258.133333 709.546667 277.333333 701.013333 277.333333 677.546667 277.333333 654.08 258.133333 624.213333 234.666667 610.986667M234.666667 440.32C211.2 426.666667 192 435.2 192 458.666667 192 482.133333 211.2 512 234.666667 525.653333 258.133333 538.88 277.333333 530.346667 277.333333 506.88 277.333333 483.413333 258.133333 453.546667 234.666667 440.32M405.333333 707.413333C381.866667 694.186667 362.666667 702.293333 362.666667 725.333333 362.666667 749.653333 381.866667 779.52 405.333333 792.746667 428.8 805.973333 448 797.866667 448 774.4 448 750.506667 428.8 720.64 405.333333 707.413333M320 573.866667C296.533333 560.64 277.333333 568.746667 277.333333 592.213333 277.333333 615.68 296.533333 645.973333 320 659.2 343.466667 672.426667 362.666667 664.32 362.666667 640 362.666667 616.96 343.466667 587.093333 320 573.866667M405.333333 536.746667C381.866667 523.52 362.666667 531.626667 362.666667 554.666667 362.666667 578.986667 381.866667 608.853333 405.333333 622.08 428.8 635.306667 448 627.2 448 603.733333 448 579.84 428.8 549.973333 405.333333 536.746667M789.333333 610.986667C765.866667 624.213333 746.666667 654.08 746.666667 677.546667 746.666667 701.013333 765.866667 709.546667 789.333333 696.32 812.8 682.666667 832 652.8 832 629.333333 832 605.866667 812.8 597.333333 789.333333 610.986667M789.333333 440.32C765.866667 453.546667 746.666667 483.413333 746.666667 506.88 746.666667 530.346667 765.866667 538.88 789.333333 525.653333 812.8 512 832 482.133333 832 458.666667 832 435.2 812.8 426.666667 789.333333 440.32M618.666667 707.413333C595.2 720.64 576 750.506667 576 774.4 576 797.866667 595.2 805.973333 618.666667 792.746667 642.133333 779.52 661.333333 749.653333 661.333333 725.333333 661.333333 702.293333 642.133333 694.186667 618.666667 707.413333M618.666667 536.746667C595.2 549.973333 576 579.84 576 603.733333 576 627.2 595.2 635.306667 618.666667 622.08 642.133333 608.853333 661.333333 578.986667 661.333333 554.666667 661.333333 531.626667 642.133333 523.52 618.666667 536.746667M704 331.52C727.04 317.866667 729.173333 296.96 709.12 285.44 688.64 273.493333 653.226667 275.2 629.76 288.853333 606.293333 302.506667 604.16 323.413333 624.64 334.933333 644.693333 346.88 680.533333 345.173333 704 331.52M386.986667 345.6C410.026667 331.946667 412.586667 311.466667 392.106667 298.666667 371.626667 287.573333 336.213333 289.28 313.173333 302.933333 289.706667 317.013333 287.146667 337.493333 307.626667 349.44 328.106667 360.96 362.666667 359.68 386.986667 345.6M545.28 338.773333C568.746667 324.693333 570.88 304.213333 550.4 292.266667 530.346667 280.746667 494.506667 282.026667 471.466667 296.106667 448 309.76 445.866667 330.24 465.92 341.333333 486.4 354.133333 521.813333 352.426667 545.28 338.773333Z" />
        </svg>
        <span class="sr-only">{{ isRandomLoading ? "Loading random level" : "Play random level" }}</span>
      </button>
    </div>
  </section>
</template>
