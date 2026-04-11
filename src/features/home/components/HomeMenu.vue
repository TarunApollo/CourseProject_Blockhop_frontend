<script setup>
import HomeButton from "@/features/home/components/HomeButton.vue";
</script>

<template>
  <div class="relative z-10 flex items-center justify-center w-full px-4">
    <div class="flex flex-col gap-6 w-64 [image-rendering:pixelated]">
      <HomeButton to="/profile" style="animation-delay: 0.1s"
        >Profile</HomeButton
      >
      <HomeButton to="/level-list" style="animation-delay: 0.3s"
        >Levels</HomeButton
      >
      <HomeButton to="/play" style="animation-delay: 0.5s">Create</HomeButton>
      <HomeButton to="/about" style="animation-delay: 0.7s">About</HomeButton>
    </div>
  </div>
</template>
