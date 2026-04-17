<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { gameVisualTokens } from "@/shared/lib/visualizationTokens";
import { useCloneLevelForm } from "@/features/level-creation/composables/useCloneLevelForm";
import { useUnpublishLevel } from "@/features/profile/composables/useUnpublishLevel";
import { useRenameLevel } from "@/features/profile/composables/useRenameLevel";
import { useDeleteLevel } from "@/features/profile/composables/useDeleteLevel";
import AppPopup from "@/shared/components/AppPopup.vue";
import LevelPreview from "./LevelPreview.vue";
import {usePublishLevel} from "@/features/profile/composables/usePublishLevel.js";

import EditLevelPropertiesForm from '@/features/profile/components/EditLevelPropertiesForm.vue'
const router = useRouter();

const props = defineProps({
  level: {
    type: Object,
    required: true,
  },
  isMenuOpen: {
    type: Boolean,
    default: false,
  }
})


const emit = defineEmits([
  "propertiesUpdated",
  "cloned",
  "renamed",
  "deleted",
  "published",
  "unpublished",
  "request-menu-toggle",
  "request-menu-close",
]);


const profileTokens = gameVisualTokens;
const showRenameInput = ref(false);
const renameDraft = ref("");
const menuRef = ref(null);
const showMenu = ref(false)
const showEditModal = ref(false)

const { sourceLevelId, isSubmitting, submitError, handleClone } =

  useCloneLevelForm((clonedLevel) => {
    emit("request-menu-close");
    emit("cloned", clonedLevel);
  });

const {
  levelId,
  isSubmitting: isUnpublishing,
  submitError: unpublishError,
  handleUnpublish,
} = useUnpublishLevel(() => {
  emit("request-menu-close");
  emit("unpublished", props.level.id);
});

const {
  levelId: publishLevelId,
  isSubmitting: isPublishing,
  submitError: publishError,
  handlePublish
} = usePublishLevel(() => {
  showMenu.value = false;
  emit("published", props.level.id);
});

const {
  isSubmitting: isRenaming,
  submitError: renameError,
  handleRename,
} = useRenameLevel((updatedLevel) => {
  showRenameInput.value = false;
  showMenu.value = false;
  emit("renamed", updatedLevel);
});

const {
  isSubmitting: isDeleting,
  submitError: deleteError,
  handleDelete,
} = useDeleteLevel((deletedId) => {
  showMenu.value = false;
  emit("deleted", deletedId);
});

const isActionPending = computed(
  () => isSubmitting.value || isUnpublishing.value || isRenaming.value || isDeleting.value || isPublishing.value,
);
const errorMessage = computed(() => submitError.value || unpublishError.value || renameError.value || deleteError.value || publishError.value);

function toggleMenu() {
  emit("request-menu-toggle");
}

function onClickClone() {
  sourceLevelId.value = props.level.id;
  handleClone();
}

function onClickUnpublish() {
  levelId.value = props.level.id;
  handleUnpublish();
}

function onClickEdit() {
  showMenu.value = false
  showEditModal.value = true
}

function onLevelSaved(updatedLevel) {
  showEditModal.value = false
  emit('propertiesUpdated', updatedLevel)
}
function onClickPublish(){
  if (!props.level.publishEligible) {
    publishError.value = "To publish a level you must complete it at least once.";
    return;
  }
  publishLevelId.value = props.level.id;
  handlePublish();
}

function dismissError() {
  submitError.value = "";
  unpublishError.value = "";
  renameError.value = "";
  deleteError.value = "";
  publishError.value = "";
}

function goToEditor() {
  emit("request-menu-close");
  router.push({
    path: `/editor/${props.level.id}`,
  });
}

function goToPlay() {
  emit("request-menu-close");
  router.push({
    name: "Play Level",
    params: { levelId: props.level.id },
  })
}

function onClickRename() {
  showMenu.value = false;
  renameDraft.value = props.level.title || "";
  showRenameInput.value = true;
}

function confirmRename() {
  handleRename(props.level.id, renameDraft.value);
}

function cancelRename() {
  showRenameInput.value = false;
  renameError.value = "";
}

function onClickDelete() {
  handleDelete(props.level.id);
}

function onClickOutside(event) {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    emit("request-menu-close");
  }
}

onMounted(() => document.addEventListener("click", onClickOutside));
onBeforeUnmount(() => document.removeEventListener("click", onClickOutside));

</script>

<template>
  <article :class="[profileTokens.backgrounds.secondaryPanel, 'relative p-4']">
    <LevelPreview
      :world-layer="level.worldLayer"
      :object-layer="level.objectLayer"
    />

    <div class="flex items-start justify-between gap-3">
      <template v-if="showRenameInput">
        <input
          v-model="renameDraft"
          type="text"
          maxlength="64"
          class="min-w-0 flex-1 bg-transparent text-2xl font-bold outline-none"
          :class="profileTokens.text.primary"
          :style="{ borderBottom: '2px solid var(--color-game-primary)' }"
          @keydown.enter="confirmRename"
          @keydown.escape="cancelRename"
        />
        <div class="flex shrink-0 gap-1">
          <button
            type="button"
            :disabled="isRenaming || !renameDraft.trim()"
            class="px-3 py-1 text-sm font-bold cursor-pointer"
            :class="[
              profileTokens.backgrounds.backButton,
              profileTokens.backgrounds.backButtonHover,
              profileTokens.text.primary,
            ]"
            @click="confirmRename"
          >
            <span v-if="!isRenaming">Save</span>
            <span v-else>Saving…</span>
          </button>
          <button
            type="button"
            :disabled="isRenaming"
            class="px-3 py-1 text-sm font-bold cursor-pointer"
            :class="[
              profileTokens.backgrounds.emptyPanel,
              profileTokens.text.secondary,
            ]"
            @click="cancelRename"
          >
            Cancel
          </button>
        </div>
      </template>

      <template v-else>
        <h3 :class="[profileTokens.text.primary, 'min-w-0 truncate text-2xl']">
          {{ level.title || "Untitled Level" }}
        </h3>

        <div class="flex shrink-0 items-center gap-2">
          <span
            :class="[
              level.published
                ? profileTokens.backgrounds.publishedBadge
                : profileTokens.backgrounds.draftBadge,
              'border-2 px-3 py-1 text-sm',
            ]"
          >
            {{ level.published ? "Published" : "Draft" }}
          </span>

          <div ref="menuRef" class="relative">
            <button
              type="button"
              :class="[
                profileTokens.backgrounds.backButton,
                profileTokens.backgrounds.backButtonHover,
                'kebab-btn',
              ]"
              :disabled="isActionPending"
              @click.stop="toggleMenu"
            >
              ···
            </button>

            <div
              v-if="isMenuOpen"
              :class="[profileTokens.backgrounds.primaryPanel, 'dropdown']"
            >
              <button
                v-if="!level.published"
                type="button"
                class="dropdown-item"
                :class="profileTokens.text.primary"
                @click="onClickEdit"
              >
                Edit Properties
              </button>
              <button
                v-if="!level.published"
                type="button"
                class="dropdown-item"
                :class="profileTokens.text.primary"
                @click="goToEditor"
              >
                Edit
              </button>
              <button
                type="button"
                :disabled="isActionPending"
                class="dropdown-item"
                :class="profileTokens.text.primary"
                @click="goToPlay"
              >
                Play
              </button>
              <button
                type="button"
                :disabled="isActionPending"
                class="dropdown-item"
                :class="profileTokens.text.primary"
                @click="onClickClone"
              >
                <span v-if="!isSubmitting">Clone Level</span>
                <span v-else>Cloning…</span>
              </button>

              <button
                v-if="level.published"
                type="button"
                :disabled="isActionPending"
                class="dropdown-item"
                :class="profileTokens.text.primary"
                @click="onClickUnpublish"
              >
                <span v-if="!isUnpublishing">Unpublish</span>
                <span v-else>Unpublishing…</span>
              </button>
              <button
                  v-if="!level.published"
                  type="button"
                  :disabled="isActionPending"
                  class="dropdown-item"
                  :class="profileTokens.text.primary"
                  @click="onClickPublish"
              >
                <span v-if="!isUnpublishing">Publish</span>
                <span v-else>Publishing…</span>
              </button>
              <button
                v-if="!level.published"
                type="button"
                :disabled="isActionPending"
                class="dropdown-item text-red-700"
                @click="onClickDelete"
              >
                <span v-if="!isDeleting">Delete</span>
                <span v-else>Deleting…</span>
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <p :class="[profileTokens.text.secondary, 'mt-3 text-base']">
      Times played: <span class="font-number-prop text-[0.6rem]">{{ level.playCount || 0 }}</span> - 
      Completes: <span class="font-number-prop text-[0.6rem]">{{ level.completeCount || 0 }}</span>
    </p>

    <p :class="[profileTokens.text.secondary, 'mt-2 min-h-12 text-base']">
      {{ level.description || "No description yet for this level." }}
    </p>

    <div
      :class="[profileTokens.backgrounds.progressBar, 'mt-4 h-3 w-full']"
    ></div>

    <p :class="[profileTokens.text.accent, 'mt-3 text-sm']">
      {{ level.published ? "Level is public" : "Level is private" }}
    </p>
  </article>

  <AppPopup v-if="errorMessage" :message="errorMessage" @close="dismissError" />

  <Teleport to="body">
    <div
      v-if="showEditModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @mousedown.self="showEditModal = false"
    >
      <EditLevelPropertiesForm :level="level" @saved="onLevelSaved" />
    </div>
  </Teleport>
</template>

<style scoped>
.kebab-btn {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  letter-spacing: 0.05em;
  line-height: 1;
  transition-property: transform, box-shadow;
  transition-duration: 70ms;
}

.dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  z-index: 20;
  min-width: 10rem;
  max-height: 12rem;
  overflow-y: auto;
  padding: 0.25rem;
  scrollbar-width: none; 
  -ms-overflow-style: none; 
}

.dropdown::-webkit-scrollbar {
  display: none; 
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  background: transparent;
  border: none;
}

.dropdown-item:hover {
  background-color: rgba(0, 0, 0, 0.08);
}

.dropdown-item:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
