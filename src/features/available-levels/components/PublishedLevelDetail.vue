<script setup>
import { computed } from "vue";
import { gameVisualTokens } from "@/shared/lib/visualizationTokens";
import LevelPreview from "@/features/profile/components/LevelPreview.vue";
import Button from "@/shared/components/Button.vue";
import FavoriteButton from "@/features/favorites/components/FavoriteButton.vue";
import ToggleSwitch from "@/shared/components/ToggleSwitch.vue";
import { useGhostPreference } from "@/shared/composables/useGhostPreference";

const props = defineProps({
  level: { type: Object, required: true },
});

defineEmits(["close"]);

const tokens = gameVisualTokens;
const { ghostEnabled } = useGhostPreference();
const showGhostToggle = computed(() => props.level.completedByCurrentUser === true);

const playRoute = computed(() => ({
  name: "Play Level",
  params: { levelId: props.level.id },
  query: {
    from: "level-list",
    ghostEligible: showGhostToggle.value ? "true" : "false",
    ...(!showGhostToggle.value || ghostEnabled.value ? {} : { ghost: "false" }),
  },
}));
</script>

<template>
  <div
    class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md"
    @click.self="$emit('close')"
  >
    <article
      :class="[
        tokens.backgrounds.primaryPanel,
        'relative mx-4 w-full max-w-lg p-6 flex flex-col gap-5',
      ]"
    >
      <button
        :class="[
          tokens.backgrounds.backButton,
          tokens.backgrounds.backButtonHover,
          'absolute right-4 top-4 h-8 w-8 flex items-center justify-center text-lg font-bold',
        ]"
        type="button"
        @click="$emit('close')"
      >
        ×
      </button>

      <div class="absolute right-14 top-4 z-10">
        <FavoriteButton :level="level" />
      </div>

      <h3 :class="[tokens.text.title, 'text-center text-2xl']">
        {{ level.title || "Untitled Level" }}
      </h3>

      <p :class="[tokens.text.accent, 'text-center text-sm']">
        by {{ level.creatorName || "Unknown" }}
      </p>

      <LevelPreview
        :world-layer="level.worldLayer"
        :object-layer="level.objectLayer"
      />

      <div class="flex justify-around py-2">
        <div class="flex flex-col items-center">
          <span
            :class="[
              tokens.text.accent,
              'text-xs uppercase font-bold tracking-wider',
            ]"
            >Plays</span
          >
          <span
            :class="[
              tokens.text.primary,
              'text-[0.7rem] font-bold font-number-prop',
            ]"
            >{{ level.playCount }}</span
          >
        </div>
        <div class="flex flex-col items-center">
          <span
            :class="[
              tokens.text.accent,
              'text-xs uppercase font-bold tracking-wider',
            ]"
            >Clear Rate</span
          >
          <span
            :class="[
              tokens.text.primary,
              'text-[0.7rem] font-bold font-number-prop',
            ]"
            >{{ (level.clearRate * 100).toFixed(1) }}%</span
          >
        </div>
      </div>

      <div>
        <p
          :class="[
            tokens.text.accent,
            'mb-2 text-sm uppercase tracking-[0.2em] font-bold',
          ]"
        >
          Description
        </p>
        <div
          :class="[
            tokens.backgrounds.secondaryPanel,
            'max-h-32 overflow-y-auto p-3',
          ]"
        >
          <p :class="[tokens.text.secondary, 'text-base leading-relaxed']">
            {{ level.description || "No description provided." }}
          </p>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <ToggleSwitch
          v-if="showGhostToggle"
          size="sm"
          variant="pill"
          label="Enable Ghost"
          v-model="ghostEnabled"
        />
        <div v-else />
        <Button :to="playRoute" class="play-btn">Play</Button>
      </div>
    </article>
  </div>
</template>

<style scoped>
.play-btn {
  background: linear-gradient(180deg, #ffe14d 0%, #f5b731 50%, #e8a010 100%);
  border: 2px solid #c4850a;
  box-shadow: 0 4px 0 rgba(56, 84, 43, 0.35);
  color: #6b3a00;
  transition:
    transform 70ms ease,
    box-shadow 70ms ease;
}

.play-btn:hover {
  transform: translateY(1px);
  box-shadow: 0 2px 0 rgba(56, 84, 43, 0.35);
}

.play-btn:active {
  transform: translateY(2px);
  box-shadow: 0 0px 0 rgba(56, 84, 43, 0.35);
}
</style>
