<script setup>
import HomeButton from "@/features/home/components/HomeButton.vue";
</script>

<template>
  <div class="absolute inset-0 z-1 flex items-center justify-center">
    <div class="menu-panel flex flex-col gap-4 w-87.5">
      <HomeButton to="/profile">Profile</HomeButton>
      <HomeButton to="/level-list">Levels</HomeButton>
      <HomeButton to="/play">Create</HomeButton>
      <HomeButton to="/about">About</HomeButton>
    </div>
  </div>
</template>

<style scoped>
.menu-panel {
  background-color: rgba(17, 17, 17, 0.85);
  border: 4px solid var(--color-menu-border-outer);
  outline: 4px solid var(--color-menu-shadow);
  box-shadow:
    inset 0 0 0 4px var(--color-menu-border-inner),
    inset 0 0 10px rgba(0, 0, 0, 0.8),
    8px 8px 0px rgba(0, 0, 0, 0.6);
  padding: 2rem;
  image-rendering: pixelated;
  border-radius: 4px;
}
</style>
