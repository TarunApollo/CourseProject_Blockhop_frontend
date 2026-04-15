<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { gameVisualTokens } from "@/shared/lib/visualizationTokens";
import { useCloneLevelForm } from "@/features/level-creation/composables/useCloneLevelForm";
import { useUnpublishLevel } from "@/features/profile/composables/useUnpublishLevel";
import AppPopup from "@/shared/components/AppPopup.vue";

const router = useRouter();

const props = defineProps({
  level: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["cloned", "unpublished"]);

const profileTokens = gameVisualTokens;
const showMenu = ref(false);
const menuRef = ref(null);

const { sourceLevelId, isSubmitting, submitError, handleClone } =
  useCloneLevelForm((clonedLevel) => {
    showMenu.value = false;
    emit("cloned", clonedLevel);
  });

const {
  levelId,
  isSubmitting: isUnpublishing,
  submitError: unpublishError,
  handleUnpublish,
} = useUnpublishLevel(() => {
  showMenu.value = false;
  emit("unpublished", props.level.id);
});

const isActionPending = computed(
  () => isSubmitting.value || isUnpublishing.value,
);
const errorMessage = computed(() => submitError.value || unpublishError.value);

function toggleMenu() {
  showMenu.value = !showMenu.value;
}

function onClickClone() {
  sourceLevelId.value = props.level.id;
  handleClone();
}

function onClickUnpublish() {
  levelId.value = props.level.id;
  handleUnpublish();
}

function dismissError() {
  submitError.value = "";
  unpublishError.value = "";
}

function goToEditor() {
  showMenu.value = false;
  router.push({
    path: `/editor/${props.level.id}`,
  });
}

function goToPlay() {
  showMenu.value = false;
  router.push({
    name: "Play Level",
    params: { levelId: props.level.id },
  });
}

function onClickOutside(event) {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    showMenu.value = false;
  }
}

onMounted(() => document.addEventListener("click", onClickOutside));
onBeforeUnmount(() => document.removeEventListener("click", onClickOutside));
</script>

<template>
  <article :class="[profileTokens.backgrounds.secondaryPanel, 'relative p-4']">
    <div
      :class="[
        profileTokens.backgrounds.previewPanel,
        profileTokens.text.accent,
        'mb-4 px-4 py-8 text-center',
      ]"
    >
      LEVEL PREVIEW
    </div>

    <div class="flex items-start justify-between gap-3">
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
            v-if="showMenu"
            :class="[profileTokens.backgrounds.primaryPanel, 'dropdown']"
          >
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
          </div>
        </div>
      </div>
    </div>

    <p :class="[profileTokens.text.secondary, 'mt-3 text-base']">
      Times played: 0 - Completes: 0
    </p>

    <p :class="[profileTokens.text.secondary, 'mt-2 min-h-12 text-base']">
      {{ level.description || "No description yet for this level." }}
    </p>

    <div
      :class="[profileTokens.backgrounds.progressBar, 'mt-4 h-3 w-full']"
    ></div>

    <p :class="[profileTokens.text.accent, 'mt-3 text-sm']">
      {{ level.published ? "Visible to players" : "Hidden from players" }}
    </p>
  </article>

  <AppPopup v-if="errorMessage" :message="errorMessage" @close="dismissError" />
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
  min-width: 9rem;
  padding: 0.25rem;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
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
