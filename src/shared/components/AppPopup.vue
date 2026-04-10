<script setup>
import { gameVisualTokens } from '@/shared/lib/visualizationTokens'

defineProps({
  message: {
    type: String,
    required: true,
  },
})

defineEmits(['close'])

const tokens = gameVisualTokens
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div :class="[tokens.backgrounds.primaryPanel, 'mx-4 w-full max-w-sm p-6 flex flex-col gap-5']">
      <p :class="[tokens.text.primary, 'text-base leading-relaxed']">{{ message }}</p>
      <button
        :class="[
          tokens.backgrounds.backButton,
          tokens.backgrounds.backButtonHover,
          'self-end px-6 py-2 text-sm font-bold transition-[transform,box-shadow] duration-[70ms]',
        ]"
        type="button"
        @click="$emit('close')"
      >
        Got it
      </button>
    </div>
  </div>
</template>
