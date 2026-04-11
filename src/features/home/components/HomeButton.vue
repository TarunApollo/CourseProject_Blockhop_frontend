<script setup>
import { RouterLink } from "vue-router";

const props = defineProps({
  to: { type: String, required: true },
});
</script>

<template>
  <RouterLink
    :to="props.to"
    class="ui-btn flex items-center justify-center w-full min-h-[9vmin] text-white text-[4.5vmin] font-bold"
  >
    <span class="[text-shadow:0.4vmin_0.4vmin_0px_#000000]">
      <slot />
    </span>
  </RouterLink>
</template>
