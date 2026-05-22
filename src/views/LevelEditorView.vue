<script setup>
import BackButton from "@/shared/components/BackButton.vue";
import EditorToolbar from "@/features/level-editor/components/EditorToolbar.vue";
import EditorCanvas from "@/features/level-editor/components/EditorCanvas.vue";
import MinimapScrollbar from "@/features/level-editor/components/MinimapScrollbar.vue";
import TileSidebar from "@/features/level-editor/components/TileSidebar.vue";
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter, onBeforeRouteLeave } from "vue-router";
import { useEditorState } from "@/features/level-editor/composables/useEditorState";
import { fetchLevelToEdit } from "@/features/level-editor/lib/fetchLevelToEdit";

const router = useRouter();
const {
  setSelectedTool,
  toggleLayer,
  clearTool,
  undo,
  redo,
  loadLevel,
  canUndo,
  isDirty,
  levelTitle,
  selection,
  deleteSelection,
  clearSelection,
} = useEditorState();

const levelId = router.currentRoute.value.params.levelId;
const levelData = history.state.level;
if (levelData) {
  loadLevel(levelData);
} else {
  fetchLevelToEdit(levelId)
    .then((level) => {
      loadLevel(level);
    })
    .catch((err) => {
      console.error(err);
      router.push("/profile");
    });
}

const canvasRef = ref(null);
const toolbarRef = ref(null);
const scrollX = ref(0);
const viewportWidth = ref(0);
const totalWidth = ref(0);

function handleScroll(data) {
  scrollX.value = data.scrollX;
  viewportWidth.value = data.viewportWidth;
  totalWidth.value = data.totalWidth;
}

function scrollToPosition(position) {
  if (canvasRef.value) {
    canvasRef.value.scrollToPosition(position);
  }
}

function scrollToTile(x) {
  if (canvasRef.value) {
    canvasRef.value.scrollToTile(x);
  }
}

function handleKeyDown(e) {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;

  if (e.key === "Backspace" || e.key === "Delete") {
    if (selection.tiles.length > 0) {
      deleteSelection();
      e.preventDefault();
    }
  } else if (e.key === "Escape") {
    clearSelection();
    clearTool();
    e.preventDefault();
  } else if (e.key === "Tab") {
    toggleLayer();
    e.preventDefault();
  } else if (e.key === "1") {
    setSelectedTool("select");
  } else if (e.key === "2") {
    setSelectedTool("paintbrush");
  } else if (e.key === "3") {
    setSelectedTool("eraser");
  } else if (e.key === "s" && !e.ctrlKey && !e.metaKey) {
    setSelectedTool("select");
  } else if (e.key === "p" && !e.ctrlKey && !e.metaKey) {
    setSelectedTool("paintbrush");
  } else if (e.key === "e" && !e.ctrlKey && !e.metaKey) {
    setSelectedTool("eraser");
  } else if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
    undo();
    e.preventDefault();
  } else if (
    (e.ctrlKey && e.key === "y") ||
    ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z")
  ) {
    redo();
    e.preventDefault();
  }
}

const showUnsavedModal = ref(false);
let pendingNavigationTarget = null;
let isLeaving = false;

function hasUnsavedChanges() {
  return !isLeaving && (canUndo() || isDirty.value);
}

function handleBeforeUnload(e) {
  if (hasUnsavedChanges()) {
    e.preventDefault();
    e.returnValue = "";
    return "";
  }
}

onBeforeRouteLeave((to) => {
  if (isLeaving) return true;
  if (hasUnsavedChanges()) {
    pendingNavigationTarget = to;
    showUnsavedModal.value = true;
    return false;
  }
});

async function handleSaveAndLeave() {
  showUnsavedModal.value = false;
  const valid = await toolbarRef.value?.validateAndReturn();
  if (valid) {
    isLeaving = true;
    if (pendingNavigationTarget) {
      router.push(pendingNavigationTarget);
      pendingNavigationTarget = null;
    }
  }
}

function handleDiscardAndLeave() {
  showUnsavedModal.value = false;
  isLeaving = true;
  if (pendingNavigationTarget) {
    router.push(pendingNavigationTarget);
    pendingNavigationTarget = null;
  }
}

function handleCancelLeave() {
  showUnsavedModal.value = false;
  pendingNavigationTarget = null;
}

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("beforeunload", handleBeforeUnload);

  setTimeout(() => {
    if (canvasRef.value) {
      totalWidth.value = canvasRef.value.totalWidth;
      viewportWidth.value = canvasRef.value.viewportWidth;
      scrollX.value = canvasRef.value.scrollX;
    }
  }, 100);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("beforeunload", handleBeforeUnload);
});
</script>

<template>
  <div
    class="level-editor h-screen w-screen flex flex-col overflow-hidden relative"
  >
    <div
      class="phaser-background fixed inset-0 pointer-events-none flex flex-col"
      aria-hidden="true"
    >
      <div
        class="flex-1 bg-repeat-x bg-top"
        :style="{
          backgroundImage:
            'url(/assets/background/overworld/background_solid_sky.png)',
          backgroundSize: 'auto 100%',
        }"
      />
      <div
        class="flex-1 bg-repeat-x bg-center"
        :style="{
          backgroundImage:
            'url(/assets/background/overworld/background_clouds.png)',
          backgroundSize: 'auto 100%',
        }"
      />
      <div
        class="flex-1 bg-repeat-x bg-center"
        :style="{
          backgroundImage:
            'url(/assets/background/overworld/background_fade_trees.png)',
          backgroundSize: 'auto 100%',
        }"
      />
      <div
        class="flex-1 bg-repeat-x bg-bottom"
        :style="{
          backgroundImage:
            'url(/assets/background/overworld/background_solid_sky.png)',
          backgroundSize: 'auto 100%',
        }"
      />
    </div>

    <header
      class="flex items-center px-4 py-2 bg-editor-bg border-b-2 border-editor-border shrink-0 relative z-20"
    >
      <BackButton />
      <h1
        class="ml-4 text-xl font-bold text-editor-text"
        style="padding-left: 15px"
      >
        Level Editor - Level: "{{ levelTitle }}"
      </h1>
    </header>

    <EditorToolbar ref="toolbarRef" :scroll-to-tile="scrollToTile" />

    <main class="flex-1 flex overflow-hidden min-h-0 relative z-20">
      <div class="flex-1 flex flex-col min-w-0 min-h-0">
        <EditorCanvas
          ref="canvasRef"
          class="flex-1 min-w-0 min-h-0"
          @scroll="handleScroll"
        />
        <MinimapScrollbar
          v-if="totalWidth > 0"
          :total-width="totalWidth"
          :viewport-width="viewportWidth"
          :scroll-position="scrollX"
          @scroll-to="scrollToPosition"
        />
      </div>
      <TileSidebar class="shrink-0" />
    </main>

    <Teleport to="body">
      <div
        v-if="showUnsavedModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="handleCancelLeave"
      >
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <h2 class="text-xl font-bold mb-3 text-[#1F3B17]">Unsaved Changes</h2>
          <p class="text-[#29461F] mb-5">
            You have unsaved changes. Do you want to validate and save before leaving?
          </p>
          <div class="flex flex-col gap-2">
            <button
              @click="handleSaveAndLeave"
              class="w-full py-2 rounded-lg bg-[#5A7E4B] text-white font-semibold hover:bg-[#4a6e3b] transition-colors focus:outline-none"
            >
              Validate & Save
            </button>
            <button
              @click="handleDiscardAndLeave"
              class="w-full py-2 rounded-lg border-2 border-[#5A7E4B] text-[#1F3B17] font-semibold hover:bg-[#B8F4A6]/50 transition-colors focus:outline-none"
            >
              Discard & Leave
            </button>
            <button
              @click="handleCancelLeave"
              class="w-full py-2 rounded-lg border-2 border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors focus:outline-none"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
