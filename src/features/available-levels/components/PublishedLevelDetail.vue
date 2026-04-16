<script setup>
import { gameVisualTokens } from "@/shared/lib/visualizationTokens";
import LevelPreview from "@/features/profile/components/LevelPreview.vue";
import Button from "@/shared/components/Button.vue";

const props = defineProps({
  level: { type: Object, required: true },
});

defineEmits(["close"]);

const tokens = gameVisualTokens;
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

      <div>
        <p :class="[tokens.text.accent, 'mb-2 text-sm uppercase tracking-[0.2em] font-bold']">
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

      <div class="flex justify-center">
        <Button
          to="/play"
          class="play-btn"
        >
          Play
        </Button>
      </div>
    </article>
  </div>
</template>

<style scoped>
.play-btn {
  background: linear-gradient(180deg, #FFE14D 0%, #F5B731 50%, #E8A010 100%);
  border: 2px solid #C4850A;
  box-shadow: 0 4px 0 rgba(56, 84, 43, 0.35);
  color: #6B3A00;
  transition: transform 70ms ease, box-shadow 70ms ease;
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
