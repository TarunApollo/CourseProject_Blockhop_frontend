<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useEditorState } from "../composables/useEditorState";
import { GRID_WIDTH, GRID_HEIGHT } from "../lib/editorConstants";
import BoxContentPopup from "./BoxContentPopup.vue";
import { TILE_VARIANT_MAP } from "../lib/tileData";
import { getTileSpriteStyle } from "@/shared/lib/tileUtils";

const {
  worldLayer,
  objectLayer,
  activeLayer,
  selectedTile,
  selectedTool,
  previewMode,
  showGids,
  tileValidationIssues,
  highlightedTile,
  paintTile,
  eraseTile,
  selection,
  startSelection,
  updateSelection,
  endSelection,
  setBoxContent,
  isBoxTile,
  getPreviewPaintTileGid,
  swapTileVariant,
} = useEditorState();

const containerRef = ref(null);
const scrollContainerRef = ref(null);
const tileSize = ref(32);
const isPainting = ref(false);
const isPanning = ref(false);
const panStartClientX = ref(0);
const panStartScrollX = ref(0);
const paintedThisStroke = ref(new Set());

const cursorX = ref(-1);
const cursorY = ref(-1);
const boxContentPopup = ref(null);

const emit = defineEmits(["scroll"]);

function updateTileSize() {
  if (!scrollContainerRef.value) return;

  const availableHeight = scrollContainerRef.value.clientHeight;

  const tileByHeight = availableHeight / GRID_HEIGHT;
  tileSize.value = Math.max(16, Math.min(tileByHeight, 64));

  if (scrollContainerRef.value) {
    emit("scroll", {
      scrollX: scrollContainerRef.value.scrollLeft,
      viewportWidth: scrollContainerRef.value.clientWidth,
      totalWidth: GRID_WIDTH * tileSize.value,
    });
  }
}

function handleScroll() {
  if (scrollContainerRef.value) {
    emit("scroll", {
      scrollX: scrollContainerRef.value.scrollLeft,
      viewportWidth: scrollContainerRef.value.clientWidth,
      totalWidth: GRID_WIDTH * tileSize.value,
    });
  }
}

function scrollToPosition(position) {
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollLeft = position;
  }
}

function getWarning(x, y) {
  return tileValidationIssues.value.get(`${x},${y}`) || null;
}

// Scrolls to center the given X tile coordinate in the viewport
function scrollToTile(x) {
  if (!scrollContainerRef.value) return;
  const viewportWidth = scrollContainerRef.value.clientWidth;
  const target = x * tileSize.value - viewportWidth / 2 + tileSize.value / 2;
  const maxScroll = GRID_WIDTH * tileSize.value - viewportWidth;
  scrollContainerRef.value.scrollLeft = Math.max(
    0,
    Math.min(target, maxScroll),
  );
}

defineExpose({
  scrollToPosition,
  scrollToTile,
  totalWidth: computed(() => GRID_WIDTH * tileSize.value),
  viewportWidth: computed(() => scrollContainerRef.value?.clientWidth ?? 0),
  scrollX: computed(() => scrollContainerRef.value?.scrollLeft ?? 0),
});

onMounted(() => {
  updateTileSize();
  window.addEventListener("resize", updateTileSize);
  window.addEventListener("mousemove", handleGlobalPanMouseMove);
  setTimeout(updateTileSize, 100);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateTileSize);
  window.removeEventListener("mousemove", handleGlobalPanMouseMove);
});

const gridStyle = computed(() => ({
  display: "grid",
  gridTemplateColumns: `repeat(${GRID_WIDTH}, ${tileSize.value}px)`,
  gridTemplateRows: `repeat(${GRID_HEIGHT}, ${tileSize.value}px)`,
  width: `${GRID_WIDTH * tileSize.value}px`,
  height: `${GRID_HEIGHT * tileSize.value}px`,
}));

function getTileStyle(gid, size = tileSize.value) {
  return getTileSpriteStyle(gid, size);
}

function handleCanvasMouseDown(e) {
  if (document.activeElement && document.activeElement.tagName === "INPUT") {
    document.activeElement.blur();
  }
}

function handleMouseDown(e, x, y) {
  e.preventDefault();

  if (previewMode.value) {
    isPanning.value = true;
    panStartClientX.value = e.clientX;
    panStartScrollX.value = scrollContainerRef.value.scrollLeft;
    return;
  }

  if (selectedTool.value === "select") {
    const objTile = objectLayer.get(`${x},${y}`);
    if (objTile && isBoxTile(objTile.gid) && activeLayer.value === "object") {
      if (
        boxContentPopup.value &&
        boxContentPopup.value.x === x &&
        boxContentPopup.value.y === y
      ) {
        boxContentPopup.value = null;
      } else {
        boxContentPopup.value = { x, y, content: objTile.content || null };
      }
    } else {
      boxContentPopup.value = null;
      startSelection(x, y);
    }
  } else {
    boxContentPopup.value = null;
    isPainting.value = true;
    paintedThisStroke.value.clear();
    applyTool(x, y);
  }
}

function handleBoxContentSelect(content) {
  if (!boxContentPopup.value) return;
  setBoxContent(boxContentPopup.value.x, boxContentPopup.value.y, content);
  boxContentPopup.value = null;
}

function handleBoxContentClose() {
  boxContentPopup.value = null;
}

function handleScrollContainerMouseDown(e) {
  if (previewMode.value) {
    e.preventDefault();
    isPanning.value = true;
    panStartClientX.value = e.clientX;
    panStartScrollX.value = scrollContainerRef.value.scrollLeft;
  }
}

function handleGlobalPanMouseMove(e) {
  if (!isPanning.value) return;
  const dx = e.clientX - panStartClientX.value;
  scrollContainerRef.value.scrollLeft = panStartScrollX.value - dx;
}

function handleMouseMove(x, y) {
  if (selection.isSelecting) {
    updateSelection(x, y);
    return;
  }
  cursorX.value = x;
  cursorY.value = y;

  if (isPainting.value) {
    applyTool(x, y);
  }
}

function handleMouseUp() {
  isPainting.value = false;
  isPanning.value = false;
  paintedThisStroke.value.clear();

  if (selection.isSelecting) {
    endSelection();
  }
}

function handleMouseLeave() {
  isPainting.value = false;
  isPanning.value = false;
  paintedThisStroke.value.clear();
  cursorX.value = -1;
  cursorY.value = -1;

  if (selection.isSelecting) {
    endSelection();
  }
}

function applyTool(x, y) {
  const key = `${x},${y}`;
  if (paintedThisStroke.value.has(key)) return;
  paintedThisStroke.value.add(key);

  if (selectedTool.value === "paintbrush" && selectedTile.value) {
    paintTile(x, y, selectedTile.value);
  } else if (selectedTool.value === "eraser") {
    eraseTile(x, y);
  }
}

function getCursorPreviewGid(x, y, gid) {
  return getPreviewPaintTileGid(x, y, { gid }) ?? gid;
}

const totalTiles = GRID_WIDTH * GRID_HEIGHT;

function getPosition(index) {
  const x = index % GRID_WIDTH;
  const y = Math.floor(index / GRID_WIDTH);
  return { x, y };
}

const selectionRectStyle = computed(() => {
  if (
    !selection.isSelecting ||
    !selection.selectionStart ||
    !selection.selectionEnd
  )
    return {};

  const startX = Math.min(selection.selectionStart.x, selection.selectionEnd.x);
  const startY = Math.min(selection.selectionStart.y, selection.selectionEnd.y);
  const endX = Math.max(selection.selectionStart.x, selection.selectionEnd.x);
  const endY = Math.max(selection.selectionStart.y, selection.selectionEnd.y);

  return {
    left: `${startX * tileSize.value}px`,
    top: `${startY * tileSize.value}px`,
    width: `${(endX - startX + 1) * tileSize.value}px`,
    height: `${(endY - startY + 1) * tileSize.value}px`,
  };
});

const gridCursorClass = computed(() => {
  if (previewMode.value) return "cursor-pan";
  if (selectedTool.value === "paintbrush") return "cursor-paintbrush";
  if (selectedTool.value === "eraser" && isPainting.value)
    return "cursor-eraser-active";
  if (selectedTool.value === "eraser") return "cursor-eraser";
  if (selectedTool.value === "select") {
    if (selection.isSelecting) return "cursor-select-active";
    return "cursor-select";
  }
  if (selectedTool.value === "none") return "cursor-pan";
  return "";
});
</script>

<template>
  <div
    ref="containerRef"
    class="canvas-container flex-1 relative"
    tabindex="0"
    @contextmenu.prevent
    @mousedown="handleCanvasMouseDown"
  >
    <div
      ref="scrollContainerRef"
      class="canvas-scroll h-full overflow-x-auto overflow-y-hidden"
      :class="previewMode ? 'cursor-grab active:cursor-grabbing' : ''"
      @scroll="handleScroll"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
      @mousedown="handleScrollContainerMouseDown"
    >
      <div
        class="grid relative select-none"
        :style="gridStyle"
        :class="gridCursorClass"
      >
        <div
          v-for="index in totalTiles"
          :key="index"
          class="tile-cell relative"
          :style="{ width: `${tileSize}px`, height: `${tileSize}px` }"
          :class="[previewMode ? '' : 'outline outline-1 outline-white/50']"
          @mousedown="
            handleMouseDown(
              $event,
              getPosition(index - 1).x,
              getPosition(index - 1).y,
            )
          "
          @mousemove="
            handleMouseMove(getPosition(index - 1).x, getPosition(index - 1).y)
          "
        >
          <div
            v-if="
              worldLayer.get(
                `${getPosition(index - 1).x},${getPosition(index - 1).y}`,
              )
            "
            class="absolute inset-0"
            :style="[
              getTileStyle(
                worldLayer.get(
                  `${getPosition(index - 1).x},${getPosition(index - 1).y}`,
                ).gid,
              ),
              {
                opacity: previewMode ? 1 : activeLayer === 'object' ? 0.25 : 1,
              },
            ]"
          >
            <div
              v-if="showGids"
              class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 text-white font-mono text-[8px] font-bold px-1 rounded pointer-events-none whitespace-nowrap"
            >
              {{
                worldLayer.get(
                  `${getPosition(index - 1).x},${getPosition(index - 1).y}`,
                ).gid
              }}
            </div>
          </div>
          <div
            v-if="
              objectLayer.get(
                `${getPosition(index - 1).x},${getPosition(index - 1).y}`,
              )
            "
            class="absolute inset-0"
            :style="[
              getTileStyle(
                objectLayer.get(
                  `${getPosition(index - 1).x},${getPosition(index - 1).y}`,
                ).gid,
              ),
              {
                opacity: previewMode ? 1 : activeLayer === 'ground' ? 0.25 : 1,
              },
            ]"
          >
            <div
              v-if="showGids"
              class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 text-white font-mono text-[8px] font-bold px-1 rounded pointer-events-none whitespace-nowrap"
            >
              {{
                objectLayer.get(
                  `${getPosition(index - 1).x},${getPosition(index - 1).y}`,
                ).gid
              }}
            </div>
          </div>
          <div
            v-if="
              !previewMode &&
              objectLayer.get(
                `${getPosition(index - 1).x},${getPosition(index - 1).y}`,
              ) &&
              isBoxTile(
                objectLayer.get(
                  `${getPosition(index - 1).x},${getPosition(index - 1).y}`,
                ).gid,
              ) &&
              objectLayer.get(
                `${getPosition(index - 1).x},${getPosition(index - 1).y}`,
              ).content
            "
            class="absolute bottom-0.5 right-0.5 z-30 pointer-events-none"
          >
            <div
              :style="{
                width: `${tileSize * 0.4}px`,
                height: `${tileSize * 0.4}px`,
                ...getTileStyle(
                  objectLayer.get(
                    `${getPosition(index - 1).x},${getPosition(index - 1).y}`,
                  ).content === 'Item_Coin_Gold'
                    ? 109
                    : objectLayer.get(
                          `${getPosition(index - 1).x},${getPosition(index - 1).y}`,
                        ).content === 'Item_Coin_Silver'
                      ? 119
                      : 129,
                  tileSize * 0.4,
                ),
              }"
            />
          </div>
          <div
            v-if="
              !previewMode &&
              getWarning(getPosition(index - 1).x, getPosition(index - 1).y)
            "
            class="absolute top-0 right-0 z-40"
            style="transform: translate(25%, -25%)"
          >
            <div class="relative group">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="#fbbf24"
                stroke="#92400e"
                stroke-width="1.5"
                class="w-4 h-4 cursor-help"
              >
                <path
                  fill-rule="evenodd"
                  d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clip-rule="evenodd"
                />
              </svg>
              <div
                class="absolute bottom-full right-0 mb-1.5 hidden group-hover:block w-48 bg-[#1F3B17] text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none whitespace-normal"
              >
                {{
                  getWarning(getPosition(index - 1).x, getPosition(index - 1).y)
                    .message
                }}
                <div class="absolute top-full right-2 -mt-px">
                  <div
                    class="border-4 border-transparent border-t-[#1F3B17]"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="
              !previewMode &&
              activeLayer === 'ground' &&
              worldLayer.get(
                `${getPosition(index - 1).x},${getPosition(index - 1).y}`,
              ) &&
              TILE_VARIANT_MAP[
                worldLayer.get(
                  `${getPosition(index - 1).x},${getPosition(index - 1).y}`,
                ).gid
              ]
            "
            class="absolute top-0 left-0 z-40"
            style="transform: translate(-25%, -25%)"
          >
            <button
              class="group relative"
              type="button"
              @click.stop.prevent="
                swapTileVariant(
                  getPosition(index - 1).x,
                  getPosition(index - 1).y,
                )
              "
              @mousedown.stop.prevent
              @mouseup.stop.prevent
            >
              <!-- TODO: change this terrible icon -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="w-4 h-4 cursor-pointer text-white bg-editor-border/80 rounded-full p-0.5 hover:bg-editor-border"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                />
              </svg>
              <div
                class="absolute bottom-full left-0 mb-1.5 hidden group-hover:block bg-[#1F3B17] text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none whitespace-normal"
              >
                Switch tile variant
                <div class="absolute top-full left-2 -mt-px">
                  <div
                    class="border-4 border-transparent border-t-[#1F3B17]"
                  ></div>
                </div>
              </div>
            </button>
          </div>

          <template
            v-if="!previewMode && selectedTool === 'paintbrush' && selectedTile"
          >
            <div
              v-if="selectedTile.composite && selectedTile.tiles"
              v-for="offset in selectedTile.tiles"
              :key="offset.gid"
              v-show="
                getPosition(index - 1).x === cursorX + offset.dx &&
                getPosition(index - 1).y === cursorY + offset.dy
              "
              class="absolute inset-0 pointer-events-none z-20"
              :style="[
                getTileStyle(
                  getCursorPreviewGid(
                    getPosition(index - 1).x,
                    getPosition(index - 1).y,
                    offset.gid,
                  ),
                ),
                { opacity: 0.6 },
              ]"
            />
            <div
              v-else-if="
                !selectedTile.composite &&
                getPosition(index - 1).x === cursorX &&
                getPosition(index - 1).y === cursorY
              "
              class="absolute inset-0 pointer-events-none z-20"
              :style="[
                getTileStyle(
                  getCursorPreviewGid(
                    getPosition(index - 1).x,
                    getPosition(index - 1).y,
                    selectedTile.gid,
                  ),
                ),
                { opacity: 0.6 },
              ]"
            />
          </template>
          <!-- Highlight overlay for validation error tiles -->
          <div
            v-if="
              highlightedTile &&
              getPosition(index - 1).x === highlightedTile.x &&
              getPosition(index - 1).y === highlightedTile.y
            "
            class="absolute inset-0 pointer-events-none z-30 animate-highlight"
          ></div>
        </div>

        <div
          v-if="selection.isSelecting"
          class="selection-rect absolute pointer-events-none z-30"
          :style="selectionRectStyle"
        />

        <BoxContentPopup
          v-if="boxContentPopup && !previewMode"
          :x="boxContentPopup.x"
          :y="boxContentPopup.y"
          :tile-size="tileSize"
          :current-content="boxContentPopup.content"
          @select="handleBoxContentSelect"
          @close="handleBoxContentClose"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-container {
  background: transparent;
}

.canvas-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.canvas-scroll::-webkit-scrollbar {
  display: none;
}

.selection-rect {
  background: rgba(90, 126, 75, 0.2);
  border: 2px dashed rgba(90, 126, 75, 0.8);
}

.animate-highlight {
  background: rgba(255, 50, 50, 0.35);
  border: 3px solid rgba(255, 50, 50, 0.9);
  animation: highlight-pulse 0.8s ease-in-out infinite;
}

@keyframes highlight-pulse {
  0%,
  100% {
    background: rgba(255, 50, 50, 0.35);
    border-color: rgba(255, 50, 50, 0.9);
  }
  50% {
    background: rgba(255, 50, 50, 0.15);
    border-color: rgba(255, 50, 50, 0.5);
  }
}

/* TODO for kvn1351: change AI slopped SVG to homemade icons made in Illustrator */
.cursor-paintbrush,
.cursor-paintbrush * {
  cursor:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cline x1='12' y1='3' x2='12' y2='8.5' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cline x1='12' y1='15.5' x2='12' y2='21' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cline x1='3' y1='12' x2='8.5' y2='12' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cline x1='15.5' y1='12' x2='21' y2='12' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cline x1='12' y1='3' x2='12' y2='8.5' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3Cline x1='12' y1='15.5' x2='12' y2='21' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3Cline x1='3' y1='12' x2='8.5' y2='12' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3Cline x1='15.5' y1='12' x2='21' y2='12' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E")
      12 12,
    crosshair !important;
}

.cursor-eraser,
.cursor-eraser * {
  cursor:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Crect x='3' y='6' width='18' height='11' rx='2' fill='white' stroke='%23222' stroke-width='1.2'/%3E%3Crect x='3' y='15' width='18' height='4' rx='1' fill='%23e0e0e0' stroke='%23222' stroke-width='1.2'/%3E%3Cline x1='7' y1='15' x2='7' y2='19' stroke='%23222' stroke-width='0.7' opacity='0.4'/%3E%3Cline x1='11' y1='15' x2='11' y2='19' stroke='%23222' stroke-width='0.7' opacity='0.4'/%3E%3Cline x1='15' y1='15' x2='15' y2='19' stroke='%23222' stroke-width='0.7' opacity='0.4'/%3E%3C/svg%3E")
      4 4,
    auto !important;
}

.cursor-eraser-active,
.cursor-eraser-active * {
  cursor:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Crect x='3' y='8' width='18' height='9' rx='2' fill='white' stroke='%23222' stroke-width='1.2'/%3E%3Crect x='3' y='14.5' width='18' height='3.5' rx='1' fill='%23e0e0e0' stroke='%23222' stroke-width='1.2'/%3E%3Cline x1='7' y1='14.5' x2='7' y2='18' stroke='%23222' stroke-width='0.7' opacity='0.4'/%3E%3Cline x1='11' y1='14.5' x2='11' y2='18' stroke='%23222' stroke-width='0.7' opacity='0.4'/%3E%3Cline x1='15' y1='14.5' x2='15' y2='18' stroke='%23222' stroke-width='0.7' opacity='0.4'/%3E%3C/svg%3E")
      4 4,
    auto !important;
}

.cursor-select,
.cursor-select * {
  cursor:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M4 8V5a1 1 0 0 1 1-1h3' fill='none' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cpath d='M16 4h3a1 1 0 0 1 1 1v3' fill='none' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cpath d='M20 16v3a1 1 0 0 1-1 1h-3' fill='none' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cpath d='M8 20H5a1 1 0 0 1-1-1v-3' fill='none' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cpath d='M4 8V5a1 1 0 0 1 1-1h3' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3Cpath d='M16 4h3a1 1 0 0 1 1 1v3' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3Cpath d='M20 16v3a1 1 0 0 1-1 1h-3' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3Cpath d='M8 20H5a1 1 0 0 1-1-1v-3' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E")
      4 4,
    auto !important;
}

.cursor-select-active,
.cursor-select-active * {
  cursor:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M5 9V6a1 1 0 0 1 1-1h2' fill='none' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cpath d='M15 5h2a1 1 0 0 1 1 1v2' fill='none' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cpath d='M18 16v2a1 1 0 0 1-1 1h-2' fill='none' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cpath d='M9 19H6a1 1 0 0 1-1-1v-2' fill='none' stroke='%23222' stroke-width='5' stroke-linecap='round'/%3E%3Cpath d='M5 9V6a1 1 0 0 1 1-1h2' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3Cpath d='M15 5h2a1 1 0 0 1 1 1v2' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3Cpath d='M18 16v2a1 1 0 0 1-1 1h-2' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3Cpath d='M9 19H6a1 1 0 0 1-1-1v-2' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E")
      4 4,
    auto !important;
}

.cursor-native-grab,
.cursor-native-grab * {
  cursor: grab !important;
}

.cursor-native-grabbing,
.cursor-native-grabbing * {
  cursor: grabbing !important;
}

.cursor-pan,
.cursor-pan * {
  cursor: grab !important;
}

.cursor-pan:active,
.cursor-pan *:active {
  cursor: grabbing !important;
}
</style>
