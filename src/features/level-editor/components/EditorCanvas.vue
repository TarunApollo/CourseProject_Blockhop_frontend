<script setup>
import { GRID_WIDTH, GRID_HEIGHT } from '../lib/editorConstants'
</script>

<template>
  <div
    class="overflow-auto bg-sky-300 relative"
    style="height: calc(100vh - 140px);"
  >
    <div
      class="grid-container relative"
      :style="{
        width: `${GRID_WIDTH * 64}px`,
        height: `${GRID_HEIGHT * 64}px`
      }"
    >
      <div
        class="ground-layer absolute inset-0"
      >
        <div
          v-for="y in GRID_HEIGHT"
          :key="`ground-row-${y}`"
          class="flex"
        >
          <div
            v-for="x in GRID_WIDTH"
            :key="`ground-${x}-${y}`"
            class="tile border border-black/10"
            :style="{ width: '64px', height: '64px' }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

