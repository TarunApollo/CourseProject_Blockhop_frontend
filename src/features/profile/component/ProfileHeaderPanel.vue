<script setup>
import { gameVisualTokens } from '@/shared/lib/visualizationTokens'

defineProps({
  username: {
    type: String,
    default: '',
  },
})

const profileTokens = gameVisualTokens
</script>

<template>
  <section :class="[profileTokens.backgrounds.primaryPanel, 'w-full p-5 sm:p-6']">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p :class="[profileTokens.text.accent, 'text-sm uppercase tracking-[0.25em]']">
          Player
        </p>
        <h2 :class="[profileTokens.text.primary, 'mt-2 break-words text-3xl']">
          {{ username || 'Blockhop Player' }}
        </h2>
      </div>

      <div :class="[profileTokens.backgrounds.statusBadge, 'px-4 py-2']">
        Ready to hop
      </div>
    </div>
  </section>
</template>
