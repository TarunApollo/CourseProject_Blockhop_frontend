<script setup>
import { ref, watch, onMounted, nextTick } from "vue";
import {
  ensureAllAtlasMetadataLoaded,
  getEnemiesAtlasFrameByTileId,
  ENEMY_IMAGE_PATH,
  getTileAtlasFrameByTileId,
  TILE_IMAGE_PATH,
} from "@/shared/lib/tileUtils";

const props = defineProps({
  worldLayer: { type: Object, default: () => ({}) },
  objectLayer: { type: Object, default: () => ({}) },
});

const canvasRef = ref(null);
const isEmpty = ref(true);

let tilesetImage = null;
let enemiesImage = null;
let bgImages = null;

const BG_LAYERS = [
  {
    src: "/assets/background/overworld/background_solid_sky.png",
    yPct: 0,
    hPct: 0.25,
  },
  {
    src: "/assets/background/overworld/background_clouds.png",
    yPct: 0.25,
    hPct: 0.25,
  },
  {
    src: "/assets/background/overworld/background_fade_trees.png",
    yPct: 0.5,
    hPct: 0.25,
  },
  {
    src: "/assets/background/overworld/background_solid_sky.png",
    yPct: 0.75,
    hPct: 0.25,
  },
];

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const assetsReady = Promise.all([
  loadImage(TILE_IMAGE_PATH),
  loadImage(ENEMY_IMAGE_PATH),
  ...BG_LAYERS.map((l) => loadImage(l.src)),
]).then(([tileset, enemyAtlas, ...bgs]) => {
  tilesetImage = tileset;
  enemiesImage = enemyAtlas;
  bgImages = bgs;
});

function renderPreview() {
  if (!canvasRef.value || !tilesetImage) return;

  const tiles = [];
  const worldEntries =
    props.worldLayer instanceof Map
      ? [...props.worldLayer.entries()]
      : Object.entries(props.worldLayer || {});
  const objectEntries =
    props.objectLayer instanceof Map
      ? [...props.objectLayer.entries()]
      : Object.entries(props.objectLayer || {});

  for (const [key, val] of worldEntries) {
    const [x, y] = key.split(",").map(Number);
    const tileId = val?.tileId;
    if (tileId) {
      tiles.push({ x, y, tileId });
    }
  }

  for (const [key, val] of objectEntries) {
    const [x, y] = key.split(",").map(Number);
    const tileId = val?.tileId;
    if (tileId) {
      tiles.push({ x, y, tileId });

      // Inject top door if it's a door bottom (backend only stores bottom)
      if (tileId === "door.closed.bottom") {
        tiles.push({ x, y: y - 1, tileId: "door.closed.top" });
      } else if (tileId === "door.open.bottom") {
        tiles.push({ x, y: y - 1, tileId: "door.open.top" });
      }
    }
  }

  isEmpty.value = tiles.length === 0;

  if (tiles.length === 0) {
    canvasRef.value.width = 0;
    canvasRef.value.height = 0;
    return;
  }

  const flagTile = tiles.find((t) => t.tileId === "flag.green");
  if (!flagTile) return;

  const VIEWPORT_COLS = 25;
  const VIEWPORT_ROWS = 14;
  // play with this to change how crisp or minecraft like you want the thumbnail
  const RESOLUTION_FACTOR = 1;
  const containerWidth = canvasRef.value.parentElement?.clientWidth || 400;
  const scale = Math.max(
    1,
    Math.floor((containerWidth * RESOLUTION_FACTOR) / VIEWPORT_COLS),
  );
  const width = VIEWPORT_COLS * scale;
  const height = VIEWPORT_ROWS * scale;

  const camX = flagTile.x - 3;
  const camY = Math.min(
    Math.max(flagTile.y - Math.floor(VIEWPORT_ROWS / 2), 0),
    14 - VIEWPORT_ROWS,
  );

  const canvas = canvasRef.value;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = "#87ceeb";
  ctx.fillRect(0, 0, width, height);

  if (bgImages) {
    for (let i = 0; i < BG_LAYERS.length; i++) {
      const layer = BG_LAYERS[i];
      const img = bgImages[i];
      if (!img) continue;
      const ly = Math.floor(height * layer.yPct);
      const lh = Math.ceil(height * layer.hPct);
      const tileScale = lh / img.naturalHeight;
      for (
        let tx = 0;
        tx < width;
        tx += Math.ceil(img.naturalWidth * tileScale)
      ) {
        ctx.drawImage(
          img,
          0,
          0,
          img.naturalWidth,
          img.naturalHeight,
          tx,
          ly,
          Math.ceil(img.naturalWidth * tileScale),
          lh,
        );
      }
    }
  }

  for (const t of tiles) {
    const dx = (t.x - camX) * scale;
    const dy = (t.y - camY) * scale;

    if (dx + scale < 0 || dx > width || dy + scale < 0 || dy > height) continue;

    const isEnemy =
      typeof t.tileId === "string" && t.tileId.startsWith("enemy.");
    const atlasEntry = isEnemy
      ? getEnemiesAtlasFrameByTileId(t.tileId)
      : getTileAtlasFrameByTileId(t.tileId);
    const frame = atlasEntry?.frame;
    const sourceImage = isEnemy ? enemiesImage : tilesetImage;
    if (!frame || !sourceImage) continue;

    ctx.drawImage(
      sourceImage,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
      dx,
      dy,
      scale,
      scale,
    );
  }
}

onMounted(() => {
  Promise.all([assetsReady, ensureAllAtlasMetadataLoaded()]).then(() => {
    renderPreview();
  });
});

watch(
  () => [props.worldLayer, props.objectLayer],
  () => {
    nextTick(renderPreview);
  },
  { deep: true },
);
</script>

<template>
  <div class="mb-4 relative">
    <div
      v-if="isEmpty"
      :class="[
        'px-4 py-17 text-center text-sm',
        'border-2 border-dashed border-[#76BD7F] bg-[#81D692]/30 rounded',
      ]"
    >
      Empty level
    </div>
    <canvas
      ref="canvasRef"
      class="w-full rounded canvas-preview"
      style="image-rendering: pixelated"
      :class="{ hidden: isEmpty }"
    />
  </div>
</template>
