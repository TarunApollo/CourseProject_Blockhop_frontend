<script setup>
import HomeButton from "@/features/home/components/HomeButton.vue";
</script>

<template>
  <nav class="flex flex-col gap-[3vmin] w-[30vmin] justify-center py-[2vmin]">
    <HomeButton to="/profile">Profile</HomeButton>
    <HomeButton to="/level-list">Levels</HomeButton>
    <HomeButton to="/play">Play</HomeButton>
    <HomeButton to="/editor">Create</HomeButton>
    <HomeButton to="/about">About</HomeButton>
  </nav>
</template>
