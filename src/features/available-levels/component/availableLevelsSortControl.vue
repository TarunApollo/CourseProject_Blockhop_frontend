<script setup>
import { PUBLISHED_LEVEL_SORT_OPTIONS } from '@/features/available-levels/lib/publishedLevelsContract.js'

import { gameVisualTokens } from '@/shared/lib/visualizationTokens';
const profileTokens = gameVisualTokens;

defineProps({
  modelValue: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

function handleChange(event) {
  emit('update:modelValue', event.target.value)
}
</script>

<template>
  <label>
    Sort by
    <select :value="modelValue" @change="handleChange"
    
    :class="[profileTokens.backgrounds.backButton, profileTokens.backgrounds.backButtonHover, 'kebab-btn']"
    >
      <option
        
        v-for="option in PUBLISHED_LEVEL_SORT_OPTIONS"
        :key="option"
        :value="option"
      >
        {{ option }}
      </option>
    </select>
  </label>
</template>
