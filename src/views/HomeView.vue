<script setup>
import HomeMenu from "@/features/home/components/HomeMenu.vue";
import GameBackground from "@/shared/components/GameBackground.vue";
import MainLogo from "@/shared/components/MainLogo.vue";
</script>

<template>
  <div class="relative min-h-screen h-screen flex flex-col items-center">
    <GameBackground class="fixed inset-0 z-0" />

    <header class="flex items-center justify-center h-[30vh] px-4 z-1">
      <MainLogo />
    </header>

    <main
      class="flex-1 w-full flex items-start justify-center overflow-y-auto no-scrollbar pb-[15vh] z-1"
    >
      <HomeMenu />
    </main>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
