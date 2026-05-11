<script setup>
import { ref, watch, onMounted, nextTick } from "vue";
import { TILE_SIZE } from "@/features/level-editor/lib/editorConstants";

const props = defineProps({
  worldLayer: { type: Object, default: () => ({}) },
  objectLayer: { type: Object, default: () => ({}) },
});

const canvasRef = ref(null);
const isEmpty = ref(true);

let tilesetImage = null;
let bgImages = null;
let beeImage = null;

const BG_LAYERS = [
  { src: "/assets/background/overworld/background_solid_sky.png", yPct: 0, hPct: 0.25 },
  { src: "/assets/background/overworld/background_clouds.png", yPct: 0.25, hPct: 0.25 },
  { src: "/assets/background/overworld/background_fade_trees.png", yPct: 0.50, hPct: 0.25 },
  { src: "/assets/background/overworld/background_solid_sky.png", yPct: 0.75, hPct: 0.25 },
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
  loadImage("/assets/tiles.png"),
  loadImage("/assets/enemies/bee/bee_rest.png"),
  ...BG_LAYERS.map((l) => loadImage(l.src)),
]).then(([tileset, bee, ...bgs]) => {
  tilesetImage = tileset;
  beeImage = bee;
  bgImages = bgs;
});

function renderPreview() {
  if (!canvasRef.value || !tilesetImage) return;

  const tiles = [];

  for (const [key, val] of Object.entries(props.worldLayer)) {
    const [x, y] = key.split(",").map(Number);
    if (val && typeof val.gid === "number") {
      tiles.push({ x, y, gid: val.gid });
    }
  }

  for (const [key, val] of Object.entries(props.objectLayer)) {
    const [x, y] = key.split(",").map(Number);
    if (val && typeof val.gid === "number") {
      tiles.push({ x, y, gid: val.gid });

      // Inject top door if it's a door bottom (backend only stores bottom)
      if (val.gid === 116) {
        tiles.push({ x, y: y - 1, gid: 106 });
      } else if (val.gid === 117) {
        tiles.push({ x, y: y - 1, gid: 107 });
      }
    }
  }

  isEmpty.value = tiles.length === 0;

  if (tiles.length === 0) {
    canvasRef.value.width = 0;
    canvasRef.value.height = 0;
    return;
  }

  const flagTile = tiles.find((t) => t.gid === 69);
  if (!flagTile) return;

  const VIEWPORT_COLS = 25;
  const VIEWPORT_ROWS = 14;
  // play with this to change how crisp or minecraft like you want the thumbnail
  const RESOLUTION_FACTOR = 1;
  const containerWidth = canvasRef.value.parentElement?.clientWidth || 400;
  const scale = Math.max(1, Math.floor((containerWidth * RESOLUTION_FACTOR) / VIEWPORT_COLS));
  const width = VIEWPORT_COLS * scale;
  const height = VIEWPORT_ROWS * scale;

  const camX = flagTile.x - 3;
  const camY = Math.min(Math.max(flagTile.y - Math.floor(VIEWPORT_ROWS / 2), 0), 14 - VIEWPORT_ROWS);

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
      for (let tx = 0; tx < width; tx += Math.ceil(img.naturalWidth * tileScale)) {
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
    const id = t.gid - 1;
    const srcCol = id % 10;
    const srcRow = Math.floor(id / 10);
    const sx = srcCol * TILE_SIZE;
    const sy = srcRow * TILE_SIZE;
    const dx = (t.x - camX) * scale;
    const dy = (t.y - camY) * scale;

    if (dx + scale < 0 || dx > width || dy + scale < 0 || dy > height) continue;

    if (t.gid === 93 && beeImage) {
      ctx.drawImage(beeImage, dx, dy, scale, scale);
      continue;
    }

    ctx.drawImage(
      tilesetImage,
      sx,
      sy,
      TILE_SIZE,
      TILE_SIZE,
      dx,
      dy,
      scale,
      scale,
    );
  }
}

onMounted(() => {
  assetsReady.then(() => {
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
      class="w-full rounded"
      style="image-rendering: pixelated"
      :class="{ hidden: isEmpty }"
    />
  </div>
</template>
