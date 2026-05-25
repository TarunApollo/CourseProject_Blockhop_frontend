<script setup>
import { computed } from "vue";
import { useEditorState } from "../composables/useEditorState";
import {
  getClearConditionTypes,
  validateClearConditionInput,
} from "@/features/profile/lib/clearConditionContract";
import { getCachedTileCatalog } from "@/shared/lib/fetchTileCatalog";

const {
  clearConditionType,
  clearConditionTargetAmount,
  setClearConditionType,
  setClearConditionTargetAmount,
} = useEditorState();

const conditionTypes = computed(() => getClearConditionTypes(getCachedTileCatalog()));

const validationError = computed(() =>
  validateClearConditionInput(
    clearConditionType.value,
    clearConditionTargetAmount.value,
  ),
);

defineEmits(["close"]);

function handleConditionChange(event) {
  setClearConditionType(event.target.value);
}

function handleAmountChange(event) {
  setClearConditionTargetAmount(Number(event.target.value));
}

const currentConditionLabel = computed(() => {
  const selected = conditionTypes.value.find(
    (option) => option.value === clearConditionType.value,
  );
  return selected?.label ?? "Reach the exit";
});
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      @mousedown.self="$emit('close')"
    >
      <section class="w-full max-w-md border-2 border-editor-border bg-editor-bg p-5 shadow-xl">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-editor-text-secondary">
              Objective
            </p>
            <h3 class="mt-1 text-base font-bold text-editor-text">Clear Condition</h3>
          </div>
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center border-2 border-editor-border bg-editor-canvas text-editor-text transition-colors hover:bg-editor-bg-light focus:outline-none"
            title="Close"
            @click="$emit('close')"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p class="mt-3 border border-editor-border/30 bg-editor-canvas/80 px-3 py-2 text-xs text-editor-text-secondary">
          Current goal: {{ currentConditionLabel }}
          <span v-if="clearConditionType !== 'none'"> ({{ clearConditionTargetAmount }})</span>
        </p>

        <div class="mt-4 flex flex-col gap-3">
          <label class="flex flex-col gap-1">
            <span class="text-xs font-semibold uppercase tracking-[0.14em] text-editor-text-secondary">
              Goal Type
            </span>
            <select
              :value="clearConditionType"
              class="border-2 border-editor-border bg-editor-canvas px-3 py-2 text-sm font-semibold text-editor-text outline-none transition-colors focus:border-editor-border-hover"
              @change="handleConditionChange"
            >
              <option
                v-for="option in conditionTypes"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </label>

          <label v-if="clearConditionType !== 'none'" class="flex flex-col gap-1">
            <span class="text-xs font-semibold uppercase tracking-[0.14em] text-editor-text-secondary">
              Target Amount
            </span>
            <input
              :value="clearConditionTargetAmount"
              type="number"
              min="1"
              max="100"
              step="1"
              inputmode="numeric"
              class="border-2 border-editor-border bg-editor-canvas px-3 py-2 text-sm font-semibold text-editor-text outline-none transition-colors focus:border-editor-border-hover"
              @input="handleAmountChange"
            />
          </label>

          <p
            v-if="validationError"
            class="border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
          >
            {{ validationError }}
          </p>
          <p
            v-else
            class="border border-editor-border/30 bg-editor-canvas/80 px-3 py-2 text-xs text-editor-text-secondary"
          >
            Pick what the player must finish before the exit clears.
          </p>
        </div>
      </section>
    </div>
  </Teleport>
</template>
