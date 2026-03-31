<script setup>
import { useRouter } from 'vue-router'
import { gameVisualTokens } from '@/shared/lib/visualizationTokens'

const router = useRouter()
const visualTokens = gameVisualTokens

function goBack() {
  router.back()
}
</script>

<template>
  <button
      type="button"
      :class="[
      visualTokens.backgrounds.backButton,
      visualTokens.backgrounds.backButtonHover,
      'flex h-14 w-14 items-center justify-center transition sm:h-16 sm:w-16',
    ]"
      @click="goBack"
  >
    <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
      <path stroke-linecap="square" stroke-linejoin="miter" d="M15 6l-6 6 6 6" />
    </svg>
  </button>
</template>
