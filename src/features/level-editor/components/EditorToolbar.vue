<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useEditorState } from "../composables/useEditorState";
import { validateLevel } from "../lib/validationUtils";
import { submitEditorUpdates } from "@/features/level-editor/lib/submitEditorUpdates.js";

const props = defineProps({
  scrollToTile: { type: Function, default: null },
});

const route = useRoute();
const {
  activeLayer,
  selectedTool,
  setActiveLayer,
  setSelectedTool,
  worldLayer,
  objectLayer,
  clearLevel,
  saveState,
  undo,
  redo,
  canUndo,
  canRedo,
  previewMode,
  togglePreviewMode,
  highlightTile,
  showGids,
  toggleShowGids,
} = useEditorState();

const validationResults = ref(null);
const showClearDropdown = ref(false);
const showHelp = ref(false);
const clearDropdownStyle = ref({});

function handleValidate() {
  validationResults.value = validateLevel(worldLayer, objectLayer);
  if (validationResults.value.valid) submitUpdates();
}

async function validateAndReturn() {
  validationResults.value = validateLevel(worldLayer, objectLayer);
  if (validationResults.value.valid) {
    await submitUpdates();
    return true;
  }
  return false;
}

defineExpose({ validateAndReturn });

function clearValidation() {
  validationResults.value = null;
}

async function submitUpdates() {
  const levelId = route.params.levelId;
  await submitEditorUpdates(levelId, worldLayer, objectLayer);
}

function handleShowInEditor(x, y) {
  highlightTile(x, y);
  if (props.scrollToTile) {
    props.scrollToTile(x);
  }
  clearValidation();
}

function handleClickOutside(e) {
  if (!e.target.closest(".clear-dropdown-wrapper")) {
    showClearDropdown.value = false;
  }
}

function handleClearAll() {
  saveState();
  clearLevel();
  showClearDropdown.value = false;
}

function handleClearLayer(layer) {
  saveState();
  if (layer === "world") {
    worldLayer.clear();
  } else {
    objectLayer.clear();
  }
  showClearDropdown.value = false;
}

function toggleClearDropdown(e) {
  showClearDropdown.value = !showClearDropdown.value;
  if (showClearDropdown.value) {
    const rect = e.currentTarget.getBoundingClientRect();
    clearDropdownStyle.value = {
      position: "fixed",
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
    };
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div
    class="toolbar flex items-center gap-4 px-4 py-2 bg-editor-bg-light border-b-2 border-editor-border relative z-20"
  >
    <div
      class="layer-toggle flex rounded-lg overflow-hidden border-2 border-editor-border"
      :class="previewMode ? 'opacity-50 pointer-events-none' : ''"
    >
      <button
        @click="setActiveLayer('ground')"
        :class="[
          'px-4 py-2 font-semibold transition-colors focus:outline-none',
          activeLayer === 'ground'
            ? 'bg-editor-border text-white'
            : 'bg-editor-canvas text-editor-text hover:bg-editor-bg',
        ]"
      >
        Ground
      </button>
      <button
        @click="setActiveLayer('object')"
        :class="[
          'px-4 py-2 font-semibold transition-colors focus:outline-none',
          activeLayer === 'object'
            ? 'bg-editor-border text-white'
            : 'bg-editor-canvas text-editor-text hover:bg-editor-bg',
        ]"
      >
        Objects
      </button>
    </div>

    <div
      class="tools flex gap-2"
      :class="previewMode ? 'opacity-50 pointer-events-none' : ''"
    >
      <button
        @click="setSelectedTool('select')"
        :class="[
          'p-2 rounded-lg border-2 transition-all focus:outline-none',
          selectedTool === 'select'
            ? 'border-editor-border bg-editor-bg-active'
            : 'border-transparent hover:border-editor-border bg-editor-canvas',
        ]"
        title="Select"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 text-editor-text"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
          />
        </svg>
      </button>
      <button
        @click="setSelectedTool('paintbrush')"
        :class="[
          'p-2 rounded-lg border-2 transition-all focus:outline-none',
          selectedTool === 'paintbrush'
            ? 'border-editor-border bg-editor-bg-active'
            : 'border-transparent hover:border-editor-border bg-editor-canvas',
        ]"
        title="Paintbrush"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 text-editor-text"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
      </button>
      <button
        @click="setSelectedTool('eraser')"
        :class="[
          'p-2 rounded-lg border-2 transition-all focus:outline-none',
          selectedTool === 'eraser'
            ? 'border-editor-border bg-editor-bg-active'
            : 'border-transparent hover:border-editor-border bg-editor-canvas',
        ]"
        title="Eraser"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 text-editor-text"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>

    <div class="flex-1"></div>

    <div
      class="history-tools flex gap-1.5"
      :class="previewMode ? 'opacity-50 pointer-events-none' : ''"
    >
      <button
        @click="undo"
        :disabled="!canUndo()"
        :class="[
          'p-1.5 rounded-lg border-2 transition-all focus:outline-none',
          canUndo()
            ? 'border-[#5A7E4B] bg-[#B8F4A6] hover:bg-[#7BCF73] cursor-pointer'
            : 'border-[#5A7E4B] bg-[#B8F4A6]/50 cursor-not-allowed opacity-50',
        ]"
        title="Undo (Ctrl+Z)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-[#1F3B17]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
          />
        </svg>
      </button>
      <button
        @click="redo"
        :disabled="!canRedo()"
        :class="[
          'p-1.5 rounded-lg border-2 transition-all focus:outline-none',
          canRedo()
            ? 'border-[#5A7E4B] bg-[#B8F4A6] hover:bg-[#7BCF73] cursor-pointer'
            : 'border-[#5A7E4B] bg-[#B8F4A6]/50 cursor-not-allowed opacity-50',
        ]"
        title="Redo (Ctrl+Y)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-[#1F3B17]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
          />
        </svg>
      </button>
    </div>

    <div class="flex-1"></div>

    <button
      @click="toggleShowGids"
      :class="[
        'px-3 py-1.5 rounded-lg border-2 transition-all focus:outline-none flex items-center gap-1.5 text-sm font-semibold',
        showGids
          ? 'border-[#5A7E4B] bg-[#5A7E4B] text-white'
          : 'border-[#5A7E4B] bg-[#B8F4A6] text-[#1F3B17] hover:bg-[#7BCF73]',
      ]"
      :title="showGids ? 'Hide GIDs' : 'Show GIDs'"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
      GIDs
    </button>

    <div class="flex-1"></div>

    <button
      @click="togglePreviewMode"
      :class="[
        'px-3 py-2 rounded-lg border-2 font-semibold transition-colors flex items-center gap-1.5 focus:outline-none',
        previewMode
          ? 'border-editor-border bg-editor-border text-white'
          : 'border-editor-border bg-editor-canvas text-editor-text hover:bg-editor-bg',
      ]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
      {{ previewMode ? "Exit" : "Preview" }}
    </button>

    <div class="flex-1"></div>

    <div
      class="relative clear-dropdown-wrapper"
      :class="previewMode ? 'opacity-50 pointer-events-none' : ''"
    >
      <div class="flex rounded-lg overflow-hidden border-2 border-red-700">
        <button
          @click="handleClearAll"
          class="clear-btn px-3 py-2 text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-1.5 focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Clear
        </button>
        <button
          @click="toggleClearDropdown"
          class="px-2 py-2 text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors border-l border-red-400 flex items-center focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="3"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      <Teleport to="body">
        <div
          v-if="showClearDropdown"
          class="bg-white border-2 border-red-500 rounded-lg shadow-lg overflow-hidden z-[100] min-w-[180px]"
          :style="clearDropdownStyle"
        >
          <button
            @click="handleClearLayer('world')"
            class="w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-red-50 transition-colors font-semibold focus:outline-none"
          >
            Clear Ground Layer
          </button>
          <button
            @click="handleClearLayer('object')"
            class="w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-red-50 transition-colors font-semibold border-t border-red-100 focus:outline-none"
          >
            Clear Object Layer
          </button>
        </div>
      </Teleport>
    </div>

    <button
      @click="handleValidate"
      :disabled="previewMode"
      :class="[
        'validate-btn px-4 py-2 rounded-lg border-2 border-editor-border font-semibold transition-colors flex items-center gap-2 focus:outline-none',
        previewMode
          ? 'bg-editor-canvas/50 text-editor-text/50 cursor-not-allowed'
          : 'bg-editor-canvas text-editor-text hover:bg-editor-bg-active',
      ]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 13l4 4L19 7"
        />
      </svg>
      Validate
    </button>

    <button
      @click="showHelp = true"
      :disabled="previewMode"
      :class="[
        'p-2 rounded-lg border-2 border-[#5A7E4B] transition-colors focus:outline-none',
        previewMode
          ? 'bg-[#B8F4A6]/50 cursor-not-allowed opacity-50'
          : 'bg-[#B8F4A6] hover:bg-[#7BCF73]',
      ]"
      title="Help"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5 text-[#1F3B17]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </button>

    <Teleport to="body">
      <div
        v-if="validationResults"
        class="validation-results fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="clearValidation"
      >
        <div
          class="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl"
          style="max-width: 50vw"
        >
          <h2
            class="text-xl font-bold mb-4"
            :class="validationResults.valid ? 'text-green-600' : 'text-red-600'"
          >
            {{ validationResults.valid ? "Level Valid & Saved!" : "Validation Errors" }}
          </h2>

          <ul v-if="validationResults.errors.length" class="mb-4">
            <li
              v-for="(error, i) in validationResults.errors"
              :key="i"
              class="text-red-600 mb-1"
            >
              {{ error.message }}
              <button
                v-if="error.x != null"
                @click="handleShowInEditor(error.x, error.y)"
                class="text-blue-500 underline"
              >
                (show in editor)
              </button>
            </li>
          </ul>

          <ul v-if="validationResults.warnings.length" class="mb-4">
            <li
              v-for="(warning, i) in validationResults.warnings"
              :key="i"
              class="text-yellow-600 mb-1"
            >
              {{ warning.message }}
              <button
                v-if="warning.x != null"
                @click="handleShowInEditor(warning.x, warning.y)"
                class="text-blue-500 underline"
              >
                (show in editor)
              </button>
            </li>
          </ul>

          <button
            @click="clearValidation"
            class="w-full py-2 rounded-lg bg-editor-border text-white font-semibold hover:bg-editor-border-hover transition-colors focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showHelp"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="showHelp = false"
      >
        <div
          class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[80vh] overflow-y-auto"
        >
          <h2 class="text-2xl font-bold mb-4 text-[#1F3B17]">
            Level Editor Guide
          </h2>

          <div>
            <h3 class="text-lg font-semibold mb-2 text-[#5A7E4B]">
              Keyboard Shortcuts
            </h3>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="bg-gray-100 rounded px-3 py-2">
                <span class="font-mono font-bold text-[#5A7E4B]">Ctrl+Z</span>
              </div>
              <div class="text-gray-700 py-2">Undo</div>

              <div class="bg-gray-100 rounded px-3 py-2">
                <span class="font-mono font-bold text-[#5A7E4B]">Ctrl+Y</span>
              </div>
              <div class="text-gray-700 py-2">Redo</div>

              <div class="bg-gray-100 rounded px-3 py-2">
                <span class="font-mono font-bold text-[#5A7E4B]"
                  >Ctrl+Shift+Z</span
                >
              </div>
              <div class="text-gray-700 py-2">Redo</div>

              <div class="bg-gray-100 rounded px-3 py-2">
                <span class="font-mono font-bold text-[#5A7E4B]">1</span>
              </div>
              <div class="text-gray-700 py-2">Select tool</div>

              <div class="bg-gray-100 rounded px-3 py-2">
                <span class="font-mono font-bold text-[#5A7E4B]">2</span>
              </div>
              <div class="text-gray-700 py-2">Paintbrush tool</div>

              <div class="bg-gray-100 rounded px-3 py-2">
                <span class="font-mono font-bold text-[#5A7E4B]">3</span>
              </div>
              <div class="text-gray-700 py-2">Eraser tool</div>

              <div class="bg-gray-100 rounded px-3 py-2">
                <span class="font-mono font-bold text-[#5A7E4B]">S</span>
              </div>
              <div class="text-gray-700 py-2">Select tool</div>

              <div class="bg-gray-100 rounded px-3 py-2">
                <span class="font-mono font-bold text-[#5A7E4B]">P</span>
              </div>
              <div class="text-gray-700 py-2">Paintbrush tool</div>

              <div class="bg-gray-100 rounded px-3 py-2">
                <span class="font-mono font-bold text-[#5A7E4B]">E</span>
              </div>
              <div class="text-gray-700 py-2">Eraser tool</div>

              <div class="bg-gray-100 rounded px-3 py-2">
                <span class="font-mono font-bold text-[#5A7E4B]">Tab</span>
              </div>
              <div class="text-gray-700 py-2">Toggle layer</div>

              <div class="bg-gray-100 rounded px-3 py-2">
                <span class="font-mono font-bold text-[#5A7E4B]">Escape</span>
              </div>
              <div class="text-gray-700 py-2">Clear current tool</div>
            </div>
          </div>

          <button
            @click="showHelp = false"
            class="w-full mt-6 py-2 rounded-lg bg-editor-border text-white font-semibold hover:bg-editor-border-hover transition-colors focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
