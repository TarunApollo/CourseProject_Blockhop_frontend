<script setup>
import Button from "@/shared/components/Button.vue";
</script>

<template>
  <nav class="flex flex-col gap-[3vmin] w-[25vmin] justify-center">
    <Button to="/profile">Profile</Button>
    <Button to="/level-list">Levels</Button>
    <Button to="/play">Play</Button>
    <Button to="/create-level">Create</Button>
    <Button to="/about">About</Button>
  </nav>
</template>
