<script setup>
import { PUBLISHED_LEVEL_SORT_OPTIONS } from '@/features/available-levels/lib/publishedLevelsContract.js'

import { ref, onMounted, onBeforeUnmount } from 'vue';
import { gameVisualTokens } from '@/shared/lib/visualizationTokens';
const profileTokens = gameVisualTokens;

const isOpen = ref(false)
const dropdownRef = ref(null)

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function handleClickOutside(event) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

defineProps({
  modelValue: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

function selectOption(option) {
  emit('update:modelValue', option)
  isOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

</script>

<template>

  <div
  class="relative z-100"
  >
  <label>
    Sort by
  </label>

  <button
      type="button"
      @click="toggleDropdown"
      :class="[ profileTokens.backgrounds.backButton, profileTokens.backgrounds.backButtonHover, 'kebab-btn w-30']"
      
    >
      {{ modelValue }}
    </button>
    

    <div
      v-if="isOpen"
      class="absolute top-full left-15 w-30"
      
    >
      <div
        v-for="option in PUBLISHED_LEVEL_SORT_OPTIONS"
        :key="option"
        @click="selectOption(option)"
        :class="[profileTokens.backgrounds.backButton, profileTokens.backgrounds.backButtonHover, 'kebab-btn text-center']"
      >
        {{ option }}
      </div>
    </div>

    </div>
    <!-- <select :value="modelValue" @change="handleChange"
    
    :class="[profileTokens.backgrounds.backButton, profileTokens.backgrounds.backButtonHover, 'kebab-btn']"
    >
      <option
        :class="[profileTokens.backgrounds.primaryPanel, 'dropdown']"
        v-for="option in PUBLISHED_LEVEL_SORT_OPTIONS"
        :key="option"
        :value="option"
      >
        {{ option }}
      </option>
    </select> -->

</template>
