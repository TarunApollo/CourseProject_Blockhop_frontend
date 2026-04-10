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
  <RouterLink :to="to" class="menu-btn group relative">
    <img
      src="/assets/cursor2.svg"
      alt="cursor"
      class="invert-100 absolute left-4 opacity-0 group-hover:opacity-100 transition-opacity w-10 h-10"
    />
    <slot />
  </RouterLink>
</template>

<style scoped>
.menu-btn {
  padding: 1rem 1rem 1rem 4.5rem;
  font-family: var(--font-pixel);
  font-size: 1.25rem;
  font-weight: bold;
  color: #ffffff;
  background-color: transparent;
  border: 4px solid transparent;
  transition: all 0.1s steps(2);
  text-transform: uppercase;
  image-rendering: pixelated;
  text-shadow: 2px 2px 0px var(--color-menu-shadow);

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  &:active {
    transform: scale(0.98);
  }
}
</style>
