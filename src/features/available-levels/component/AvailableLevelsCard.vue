<script setup>
import { gameVisualTokens } from '@/shared/lib/visualizationTokens';
const profileTokens = gameVisualTokens;
import AvaliableLevelCardDetail from './AvaliableLevelCardDetail.vue';

// This section controls reactive for Detail Card state.
import { reactive } from 'vue';
const DetailsPopup = reactive({value:false})


const onEscape = (e) => {
  if (e.key === 'Escape' && DetailsPopup.value) {
        DetailsPopup.value = false;
        e.preventDefault();
    }
}

function togglePopup() {
  // Control of the escape key (can be removed completely)
  if (!DetailsPopup.value) {
    window.addEventListener("keydown", onEscape);
  }
  else {
    window.removeEventListener(onEscape);
  }
  DetailsPopup.value = !DetailsPopup.value; // change state
}


defineProps({
  level: {
    type: Object,
    required: true,
  },
})

</script>



<template>

  <article
    @click="togglePopup"
    :class="['relative p-4 h-70 w-100']">
    <img
      :src="level.thumbnailUrl"
      :alt="`${level.title || 'Untitled level'} thumbnail`"
      :class="[profileTokens.text.accent, 'mb-4 px-4 py-8 text-center w-100 h-45 border']"
      />
    <h3 :class="[profileTokens.text.primary,'text-center']">{{ level.title || 'Untitled level' }}</h3>
    <div
      v-if="DetailsPopup.value"
      :class="'fixed inset-0 z-100'"
    >
      <AvaliableLevelCardDetail :level="level"/>
    </div>
    
  </article>
</template>

