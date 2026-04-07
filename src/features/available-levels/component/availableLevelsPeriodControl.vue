<script setup>
import { PUBLISHED_LEVEL_PERIOD_OPTIONS } from '@/features/available-levels/lib/publishedLevelsContract.js'

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
    Period
    <select :value="modelValue" @change="handleChange">
      <option
        v-for="option in PUBLISHED_LEVEL_PERIOD_OPTIONS"
        :key="option"
        :value="option"
      >
        {{ option }}
      </option>
    </select>
  </label>
</template>
