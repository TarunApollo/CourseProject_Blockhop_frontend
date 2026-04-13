<script setup>
import { computed } from "vue";

const props = defineProps({
  to: {
    type: String,
  },
  size: {
    type: String,
    default: "md",
  },
});

const comp = computed(() => {
  return props.to ? "RouterLink" : "button";
});

const sizeClass = computed(() => {
  switch (props.size) {
    case "rect":
      return "px-[1.5vmin] py-[1.5vmin] text-[2vmin]";
    case "sm":
      return "px-[3vmin] py-[1.5vmin] text-[2vmin]";
    case "lg":
      return "px-[6vmin] py-[3vmin] text-[5vmin]";
    case "md":
    default:
      return "px-[4vmin] py-[2vmin] text-[3vmin]";
  }
});
</script>

<template>
  <component
    :is="comp"
    :to="props.to"
    class="ui-btn flex items-center justify-center text-black text-[3vmin] font-semibold pointer-events-auto"
    :class="sizeClass"
  >
    <span>
      <slot />
    </span>
  </component>
</template>

<style scoped></style>

