<script setup>
import HomeButton from "@/features/home/components/HomeButton.vue";
</script>

<template>
  <div class="absolute inset-0 z-1 flex items-center justify-center">
    <div class="ui-panel flex flex-col gap-4 w-87.5 p-8">
      <HomeButton to="/profile">Profile</HomeButton>
      <HomeButton to="/level-list">Levels</HomeButton>
      <HomeButton to="/play">Create</HomeButton>
      <HomeButton to="/about">About</HomeButton>
    </div>
  </div>
</template>
