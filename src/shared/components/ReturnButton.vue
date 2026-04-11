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
  <div class="absolute left-10 top-10 z-100">
    <RouterLink
      :to="props.to"
      class="ui-btn relative flex items-center justify-center w-16 h-16"
    >
      <BackArrow />
    </RouterLink>
  </div>
</template>
