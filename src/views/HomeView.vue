<script setup>
import HomeMenu from "@/features/home/components/HomeMenu.vue";
import GameBackground from "@/shared/components/GameBackground.vue";
import MainLogo from "@/shared/components/MainLogo.vue";
</script>

<template>
  <div class="relative min-h-screen overflow-hidden flex flex-col items-center">
    <GameBackground class="fixed inset-0 z-0" />

    <div class="flex items-center justify-center w-full p-10">
      <MainLogo />
    </div>

    <div class="flex items-start justify-center w-full">
      <HomeMenu />
    </div>
  </div>
</template>
