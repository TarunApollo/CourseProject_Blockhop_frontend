<script setup>
import { computed } from 'vue'
import { useEditorState } from '../composables/useEditorState'
import { groundTiles, objectTiles } from '../lib/tileData'
import TileSelector from './TileSelector.vue'

const { activeLayer } = useEditorState()

const tilesToShow = computed(() => {
  return activeLayer.value === 'ground' ? groundTiles : objectTiles
})
</script>

<template>
  <aside class="sidebar w-72 bg-editor-canvas border-l-2 border-editor-border overflow-y-auto">
    <div class="p-4">
      <h3 class="text-lg font-bold text-editor-text mb-4">
        {{ activeLayer === 'ground' ? 'Ground Tiles' : 'Object Tiles' }}
      </h3>

      <div class="tiles-grid grid grid-cols-3 gap-2">
        <TileSelector
          v-for="tile in tilesToShow"
          :key="tile.gid"
          :tile="tile"
        />
      </div>
    </div>
  </aside>
</template>
