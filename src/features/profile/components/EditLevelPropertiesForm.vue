<script setup>
import { useEditLevelPropertiesForm } from '@/features/profile/composables/useEditLevelPropertiesForm'
import { CLEAR_CONDITION_TYPES } from '@/features/profile/lib/clearConditionContract'
import AppPopup from '@/shared/components/AppPopup.vue'
import Button from '@/shared/components/Button.vue'
import { gameVisualTokens } from '@/shared/lib/visualizationTokens'

const props = defineProps({
  level: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['saved'])

const tokens = gameVisualTokens

const { title, description, conditionType, targetAmount, isSubmitting, submitError, handleSubmit } =
  useEditLevelPropertiesForm(props.level, (updatedLevel) => emit('saved', updatedLevel))

function dismissError() {
  submitError.value = ''
}
</script>

<template>
  <div :class="[tokens.backgrounds.primaryPanel, 'w-full max-w-md p-6 sm:p-8 flex flex-col gap-5']">
    <div>
      <p :class="[tokens.text.accent, 'text-sm uppercase tracking-[0.25em]']">Workshop</p>
      <h2 :class="[tokens.text.primary, 'mt-1 text-3xl font-[\'Pixelify_Sans\',monospace]']">
        Edit Level
      </h2>
    </div>

    <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
      <div class="flex flex-col gap-1">
        <div class="flex justify-between items-baseline">
          <label
            :class="[tokens.text.primary, 'text-sm font-bold uppercase tracking-[0.15em]']"
            for="edit-level-title"
          >
            Title
          </label>
          <span :class="[tokens.text.secondary, 'text-xs']">{{ title.length }}/60</span>
        </div>
        <input
          id="edit-level-title"
          v-model="title"
          type="text"
          placeholder="Enter level title…"
          maxlength="60"
          :disabled="isSubmitting"
          class="form-field"
        />
      </div>

      <div class="flex flex-col gap-1">
        <div class="flex justify-between items-baseline">
          <label
            :class="[tokens.text.primary, 'text-sm font-bold uppercase tracking-[0.15em]']"
            for="edit-level-description"
          >
            Description
          </label>
          <span :class="[tokens.text.secondary, 'text-xs']">{{ description.length }}/300</span>
        </div>
        <textarea
          id="edit-level-description"
          v-model="description"
          rows="4"
          placeholder="Describe your level…"
          maxlength="300"
          :disabled="isSubmitting"
          class="form-field resize-none"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label
          :class="[tokens.text.primary, 'text-sm font-bold uppercase tracking-[0.15em]']"
          for="edit-level-condition"
        >
          Clear Condition
        </label>
        <select
          id="edit-level-condition"
          v-model="conditionType"
          :disabled="isSubmitting"
          class="form-field"
        >
          <option
            v-for="option in CLEAR_CONDITION_TYPES"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <div v-if="conditionType !== 'none'" class="flex flex-col gap-1">
        <label
          :class="[tokens.text.primary, 'text-sm font-bold uppercase tracking-[0.15em]']"
          for="edit-level-amount"
        >
          Target Amount
        </label>
        <input
          id="edit-level-amount"
          v-model.number="targetAmount"
          type="number"
          min="1"
          max="100"
          step="1"
          inputmode="numeric"
          required
          :disabled="isSubmitting"
          class="form-field"
        />
      </div>

      <Button type="submit" size="md" :disabled="isSubmitting">
        <span v-if="!isSubmitting">Save Changes</span>
        <span v-else class="flex items-center justify-center gap-2">
          <span
            class="w-[13px] h-[13px] border-2 border-green-950/20 border-t-green-950 rounded-full animate-spin"
          />
          Saving…
        </span>
      </Button>
    </form>
  </div>

  <AppPopup v-if="submitError" :message="submitError" @close="dismissError" />
</template>

<style scoped>
.form-field {
  border: 2px solid #5a7e4b;
  background-color: #b5e99d;
  color: #1f3b17;
  padding: 0.5rem 0.75rem;
}

.form-field:focus {
  outline: none;
  border-color: #2d551f;
}

.form-field:disabled {
  opacity: 0.6;
}

.form-field::placeholder {
  color: rgba(90, 126, 75, 0.7);
}
</style>
