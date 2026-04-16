<script setup>
import { ref, onBeforeUnmount } from "vue";
import { gameVisualTokens } from "@/shared/lib/visualizationTokens";
import LevelPreview from "@/features/profile/components/LevelPreview.vue";
import PublishedLevelDetail from "./PublishedLevelDetail.vue";

const props = defineProps({
  level: { type: Object, required: true },
});

const tokens = gameVisualTokens;
const showDetail = ref(false);

function openDetail() {
  showDetail.value = true;
  document.addEventListener("keydown", onEscape);
}

function closeDetail() {
  showDetail.value = false;
  document.removeEventListener("keydown", onEscape);
}

function onEscape(e) {
  if (e.key === "Escape" && showDetail.value) {
    closeDetail();
    e.preventDefault();
  }
}

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onEscape);
});
</script>

<template>
  <article
    :class="[tokens.backgrounds.secondaryPanel, 'relative cursor-pointer p-4']"
    @click="openDetail"
  >
    <LevelPreview
      :world-layer="level.worldLayer"
      :object-layer="level.objectLayer"
    />

    <h3 :class="[tokens.text.primary, 'min-w-0 truncate text-2xl']">
      {{ level.title || "Untitled Level" }}
    </h3>

    <p :class="[tokens.text.secondary, 'mt-2 min-h-12 text-base']">
      {{ level.description || "No description provided." }}
    </p>
  </article>

  <Teleport to="body">
    <PublishedLevelDetail
      v-if="showDetail"
      :level="level"
      @close="closeDetail"
    />
  </Teleport>
</template>
