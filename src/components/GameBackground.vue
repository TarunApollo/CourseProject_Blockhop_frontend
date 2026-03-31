<script setup>
import { gameVisualTokens } from '@/shared/lib/visualizationTokens'

const visualTokens = gameVisualTokens
</script>

<template>
  <div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
    <div
        class="absolute inset-0 bg-repeat-x bg-top"
        :style="{
        backgroundImage: `url('${visualTokens.assets.skyBackground}')`,
        backgroundRepeat: 'repeat-x',
        backgroundPosition: 'center top',
        backgroundSize: visualTokens.backgroundSize,
      }"
    ></div>

    <div
        class="absolute inset-x-0 bottom-[24vh] h-[28vh] min-h-[180px] max-h-[260px] bg-repeat-x"
        :style="{
        backgroundImage: `url('${visualTokens.assets.cloudsBackground}')`,
        backgroundRepeat: 'repeat-x',
        backgroundPosition: 'center bottom',
        backgroundSize: visualTokens.backgroundSize,
      }"
    ></div>

    <div
        class="absolute inset-x-0 bottom-[10vh] h-[28vh] min-h-[180px] max-h-[260px] bg-repeat-x"
        :style="{
        backgroundImage: `url('${visualTokens.assets.treesBackground}')`,
        backgroundRepeat: 'repeat-x',
        backgroundPosition: 'center bottom',
        backgroundSize: visualTokens.backgroundSize,
      }"
    ></div>

    <div
        class="absolute inset-x-0 bottom-0 h-[18vh] min-h-[120px] max-h-[180px] bg-repeat-x bg-bottom"
        :style="{
        backgroundImage: `url('${visualTokens.assets.grassBackground}')`,
        backgroundRepeat: 'repeat-x',
        backgroundPosition: 'center bottom',
        backgroundSize: visualTokens.backgroundSize,
      }"
    ></div>
  </div>
</template>
