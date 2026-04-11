<script setup>
import { RouterLink } from "vue-router";
import BackArrow from "@/assets/BackArrow.vue";

const props = defineProps({
  to: {
    type: String,
    default: "/home",
  },
});
</script>

<template>
  <RouterLink
    :to="props.to"
    class="ui-btn relative flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 shrink-0"
  >
    <BackArrow />
  </RouterLink>
</template>
