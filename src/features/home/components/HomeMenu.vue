<script setup>
import HomeButton from "@/features/home/components/HomeButton.vue";
</script>

<template>
  <nav
    class="flex flex-col gap-[3vmin] w-[30vmin] h-full justify-start py-[2vmin]"
  >
    <HomeButton to="/profile">Profile</HomeButton>
    <HomeButton to="/level-list">Levels</HomeButton>
    <HomeButton to="/play">Play</HomeButton>
    <!--  /create route feature wip for now just placeholder -->
    <HomeButton to="/play">Create</HomeButton>
    <HomeButton to="/about">About</HomeButton>
  </nav>
</template>
