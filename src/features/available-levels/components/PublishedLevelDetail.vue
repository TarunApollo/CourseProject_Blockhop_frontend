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
        'mx-4 w-full max-w-lg p-6 flex flex-col gap-5',
      ]"
    >
      <h3 :class="[tokens.text.title, 'text-center text-2xl']">
        {{ level.title || "Untitled Level" }}
      </h3>

      <LevelPreview
        :world-layer="level.worldLayer"
        :object-layer="level.objectLayer"
      />

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

      <div class="flex justify-center gap-3">
        <Button to="/play">Play</Button>
        <button
          :class="[
            tokens.backgrounds.backButton,
            tokens.backgrounds.backButtonHover,
            'px-4 py-2 text-sm font-bold',
          ]"
          type="button"
          @click="$emit('close')"
        >
          Close
        </button>
      </div>
    </article>
  </div>
</template>
