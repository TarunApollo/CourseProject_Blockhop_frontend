<script setup>
import { GRID_WIDTH, GRID_HEIGHT } from "../lib/editorConstants";

const opacity = 1;

const THUMBNAIL_TILE_SIZE = 24;
const ORIGINAL_TILE_SIZE = 128;
const TILESET_WIDTH = 1280;
const TILESET_HEIGHT = 2560;

const props = defineProps({
  worldLayer: { type: Map, required: true },
  objectLayer: { type: Map, required: true },
});

const totalTiles = GRID_WIDTH * GRID_HEIGHT;

const gridStyle = {
  display: "grid",
  gridTemplateColumns: `repeat(${GRID_WIDTH}, ${THUMBNAIL_TILE_SIZE}px)`,
  gridTemplateRows: `repeat(${GRID_HEIGHT}, ${THUMBNAIL_TILE_SIZE}px)`,
  width: `${GRID_WIDTH * THUMBNAIL_TILE_SIZE}px`,
  height: `${GRID_HEIGHT * THUMBNAIL_TILE_SIZE}px`,
};

const sceneStyle = {
  width: `${GRID_WIDTH * THUMBNAIL_TILE_SIZE}px`,
  height: `${GRID_HEIGHT * THUMBNAIL_TILE_SIZE}px`,
};

function getPosition(index) {
  const x = index % GRID_WIDTH;
  const y = Math.floor(index / GRID_WIDTH);
  return { x, y };
}

function getTileStyle(gid) {
  if (!gid) return {};
  const id = gid - 1;
  const col = id % 10;
  const row = Math.floor(id / 10);
  const scale = THUMBNAIL_TILE_SIZE / ORIGINAL_TILE_SIZE;
  return {
    backgroundImage: "url(/assets/tiles.png)",
    backgroundSize: `${TILESET_WIDTH * scale}px ${TILESET_HEIGHT * scale}px`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: `-${col * ORIGINAL_TILE_SIZE * scale}px -${row * ORIGINAL_TILE_SIZE * scale}px`,
  };
}
</script>

<template>
  <div
    class="canvas-container relative overflow-hidden inline-block"
    :style="sceneStyle"
  >
    <div
      class="phaser-background absolute inset-0 pointer-events-none flex flex-col"
      aria-hidden="true"
    >
      <div
        class="flex-1 bg-repeat-x bg-top"
        :style="{
          backgroundImage: 'url(/assets/background/overworld/background_solid_sky.png)',
          backgroundSize: 'auto 100%',
        }"
      />
      <div
        class="flex-1 bg-repeat-x bg-center"
        :style="{
          backgroundImage: 'url(/assets/background/overworld/background_clouds.png)',
          backgroundSize: 'auto 100%',
        }"
      />
      <div
        class="flex-1 bg-repeat-x bg-center"
        :style="{
          backgroundImage: 'url(/assets/background/overworld/background_fade_trees.png)',
          backgroundSize: 'auto 100%',
        }"
      />
      <div
        class="flex-1 bg-repeat-x bg-bottom"
        :style="{
          backgroundImage: 'url(/assets/background/overworld/background_solid_sky.png)',
          backgroundSize: 'auto 100%',
        }"
      />
    </div>
    <div class="thumbnail-scene relative z-10">
      <div
        class="grid relative select-none"
        :style="gridStyle"
      >
        <div
          v-for="index in totalTiles"
          :key="index"
          class="tile-cell relative"
          :style="{ width: `${THUMBNAIL_TILE_SIZE}px`, height: `${THUMBNAIL_TILE_SIZE}px` }"
        >
          <div
            v-if="
              props.worldLayer.get(
                `${getPosition(index - 1).x},${getPosition(index - 1).y}`,
              )
            "
            class="absolute inset-0"
            :style="[
              getTileStyle(
                props.worldLayer.get(
                  `${getPosition(index - 1).x},${getPosition(index - 1).y}`,
                ).gid
              ),
              { opacity },
            ]"
          >
          </div>
          <div
            v-if="
              props.objectLayer.get(
                `${getPosition(index - 1).x},${getPosition(index - 1).y}`,
              )
            "
            class="absolute inset-0"
            :style="[
              getTileStyle(
                props.objectLayer.get(
                  `${getPosition(index - 1).x},${getPosition(index - 1).y}`,
                ).gid
              ),
              { opacity },
            ]"
          >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
