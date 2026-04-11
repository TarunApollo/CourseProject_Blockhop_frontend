<script setup>
import { RouterLink } from "vue-router";
import BackArrow from "@/assets/BackArrow.vue";
</script>

<template>
  <div class="absolute left-10 top-10 z-100">
    <RouterLink
      to="/home"
      class="ui-btn relative flex items-center justify-center w-16 h-16"
    >
      <BackArrow />
    </RouterLink>
  </div>
</template>
