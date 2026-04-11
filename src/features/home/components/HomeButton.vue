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
    :to="props.to"
    class="ui-btn bg-dirt-block bg-home-btn-dirt-dark text-white relative flex flex-col items-center justify-center text-4xl font-bold py-6 px-4"
  >
    <span class="relative z-10 [text-shadow:3px_3px_0px_#000000]">
      <slot />
    </span>
  </RouterLink>
</template>
