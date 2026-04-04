<script setup>
import { ref } from 'vue'
import { useEditorState } from '../composables/useEditorState'
import { GRID_WIDTH, GRID_HEIGHT, TILE_SIZE } from '../lib/editorConstants'
import { getSpritePosition } from '../lib/tileData'

const {
  worldLayer,
  objectLayer,
  activeLayer,
  selectedTile,
  selectedTool,
  paintTile,
  eraseTile
} = useEditorState()

const isPainting = ref(false)

function handleMouseDown(e, x, y) {
  isPainting.value = true
  applyTool(x, y)
}

function handleMouseMove(e, x, y) {
  if (isPainting.value) {
    applyTool(x, y)
  }
}

function handleMouseUp() {
  isPainting.value = false
}

function applyTool(x, y) {
  if (selectedTool.value === 'paintbrush' && selectedTile.value) {
    paintTile(x, y, selectedTile.value)
  } else if (selectedTool.value === 'eraser') {
    eraseTile(x, y)
  }
}

function getTileStyle(gid) {
  if (!gid) return {}
  return {
    backgroundImage: 'url(/assets/tiles.png)',
    backgroundSize: `${1280}px ${2560}px`,
    backgroundPosition: getSpritePosition(gid, TILE_SIZE),
    backgroundRepeat: 'no-repeat'
  }
}
</script>

<template>
  <div
    class="overflow-auto bg-sky-300 relative"
    style="height: calc(100vh - 140px);"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
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
        :style="{ opacity: activeLayer === 'ground' ? 1 : 0.4 }"
      >
        <div
          v-for="y in GRID_HEIGHT"
          :key="`ground-row-${y}`"
          class="flex"
        >
          <div
            v-for="x in GRID_WIDTH"
            :key="`ground-${x}-${y}`"
            class="tile border border-black/10 relative"
            :style="{ width: '64px', height: '64px' }"
            @mousedown="handleMouseDown($event, x - 1, y - 1)"
            @mousemove="handleMouseMove($event, x - 1, y - 1)"
          >
            <div
              v-if="worldLayer.get(`${x-1},${y-1}`)"
              class="absolute inset-0"
              :style="getTileStyle(worldLayer.get(`${x-1},${y-1}`).gid)"
            />
          </div>
        </div>
      </div>

      <div
        class="object-layer absolute inset-0 pointer-events-none"
        :style="{ opacity: activeLayer === 'object' ? 1 : 0.4 }"
      >
        <div
          v-for="y in GRID_HEIGHT"
          :key="`object-row-${y}`"
          class="flex"
        >
          <div
            v-for="x in GRID_WIDTH"
            :key="`object-${x}-${y}`"
            class="tile relative"
            :style="{ width: '64px', height: '64px' }"
          >
            <div
              v-if="objectLayer.get(`${x-1},${y-1}`)"
              class="absolute inset-0"
              :style="getTileStyle(objectLayer.get(`${x-1},${y-1}`).gid)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
