<script setup>
import { computed } from 'vue'
import { getSpritePosition } from '../lib/tileData'

const props = defineProps({
  tile: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  showGid: { type: Boolean, default: false }
})

const TILE_PREVIEW_SIZE = 56

// Since we don't have  Phaser's asset loader to help us in cutting
// We gotta do it ourselves:
// all tiles live in tiles.png -> 10×20 grid of 128px tiles
// instead of loading indivdual images, we load the full sheet and use the container
// as a clipping window. Back to preeschool boys and gals. 
// backgroundSize scales the sheet proportionally so each tile
// matches the preview size. backgroundPosition shifts the sheet so the correct tile
// aligns with the container, showing only that one tile.
// https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Images/Implementing_image_sprites

const spriteStyle = computed(() => ({
  backgroundImage: 'url(/assets/tiles.png)',
  backgroundSize: `${1280 * (TILE_PREVIEW_SIZE / 128)}px ${2560 * (TILE_PREVIEW_SIZE / 128)}px`,
  backgroundPosition: getSpritePosition(props.tile.gid, TILE_PREVIEW_SIZE),
  backgroundRepeat: 'no-repeat'
}))
</script>

<template>
  <button
    class="tile-selector p-1 rounded-lg border-2 transition-all flex flex-col items-center"
    :class="selected
      ? 'border-editor-border bg-editor-bg-active'
      : 'border-transparent hover:border-editor-border bg-white/50'"
    :title="tile.type"
  >
    <div
      class="tile-preview rounded relative"
      :style="{
        width: `${TILE_PREVIEW_SIZE}px`,
        height: `${TILE_PREVIEW_SIZE}px`,
        ...spriteStyle
      }"
    >
      <div
        v-if="showGid"
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 text-white font-mono text-[9px] font-bold px-1 rounded pointer-events-none whitespace-nowrap"
      >
        {{ tile.gid }}
      </div>
    </div>
    <span class="text-xs text-editor-text mt-1 truncate w-full text-center">
      {{ tile.type.replace('Item_', '').replace('Enemy_', '') }}
    </span>
  </button>
</template>
