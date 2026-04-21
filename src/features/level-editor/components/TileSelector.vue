<script setup>
import { computed } from 'vue'
import { TILE_SIZE, TILESET_WIDTH, TILESET_HEIGHT } from '../lib/editorConstants'

const props = defineProps({
  tile: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  showGid: { type: Boolean, default: false }
})

import { getTileSpriteStyle } from '@/shared/lib/tileUtils'

const TILE_PREVIEW_SIZE = 48

// Since we don't have Phaser's asset loader to help us in cutting
// We gotta do it ourselves:
// all tiles live in tiles.png -> 10×20 grid of 128px tiles
// instead of loading individual images, we load the full sheet and use the container
// as a clipping window. Back to preschool boys and gals.
// backgroundSize scales the sheet proportionally so each tile
// matches the preview size. backgroundPosition shifts the sheet so the correct tile
// aligns with the container, showing only that one tile.
// https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Images/Implementing_image_sprites

const isComposite = computed(() => props.tile.composite && props.tile.tiles)

const compositeTiles = computed(() => props.tile.tiles || [])

const compositeBounds = computed(() => {
  if (!isComposite.value) return { width: 1, height: 1, minX: 0, minY: 0 }
  
  const tiles = compositeTiles.value
  let minX = 0, maxX = 0, minY = 0, maxY = 0
  for (const t of tiles) {
    minX = Math.min(minX, t.dx)
    maxX = Math.max(maxX, t.dx)
    minY = Math.min(minY, t.dy)
    maxY = Math.max(maxY, t.dy)
  }
  return {
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    minX,
    minY
  }
})

const previewWidth = computed(() => TILE_PREVIEW_SIZE * compositeBounds.value.width)
const previewHeight = computed(() => TILE_PREVIEW_SIZE * compositeBounds.value.height)

const singleTileStyle = computed(() => getTileSpriteStyle(props.tile.gid, TILE_PREVIEW_SIZE))

function getCompositeTileStyle(compositeTile) {
  const bounds = compositeBounds.value
  const size = TILE_PREVIEW_SIZE
  
  const offsetX = (compositeTile.dx - bounds.minX) * size
  const offsetY = (compositeTile.dy - bounds.minY) * size
  
  return {
    position: 'absolute',
    left: `${offsetX}px`,
    top: `${offsetY}px`,
    ...getTileSpriteStyle(compositeTile.gid, size)
  }
}

const displayName = computed(() => {
  return props.tile.type
    .replace('Item_', '')
    .replace('Enemy_', '')
    .replace('_', ' ')
})
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
      class="tile-preview rounded relative overflow-hidden"
      :style="{
        width: `${previewWidth}px`,
        height: `${previewHeight}px`,
      }"
    >
      <template v-if="isComposite">
        <div
          v-for="(ct, idx) in compositeTiles"
          :key="idx"
          :style="getCompositeTileStyle(ct)"
        />
      </template>
      <div
        v-else
        :style="{
          width: `${TILE_PREVIEW_SIZE}px`,
          height: `${TILE_PREVIEW_SIZE}px`,
          ...singleTileStyle
        }"
      />
      <div
        v-if="showGid"
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 text-white font-mono text-[9px] font-bold px-1 rounded pointer-events-none whitespace-nowrap"
      >
        {{ tile.gid }}
      </div>
    </div>
    <span class="text-xs text-editor-text mt-1 truncate w-full text-center">
      {{ displayName }}
    </span>
  </button>
</template>