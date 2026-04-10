<script setup>
import { RouterLink } from "vue-router";

const props = defineProps({
  to: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <RouterLink
    :to="to"
    class="ui-btn group relative flex items-center p-4 pl-18 uppercase"
  >
    <img
      src="/assets/cursor2.svg"
      alt="cursor"
      class="invert-100 absolute left-4 opacity-0 group-hover:opacity-100 transition-opacity w-10 h-10"
    />
    <slot />
  </RouterLink>
</template>
