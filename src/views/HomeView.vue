<script setup>
import HomeMenu from "@/features/home/components/HomeMenu.vue";
import GameBackground from "@/shared/components/GameBackground.vue";
import LoginTitle from "@/features/login-page/components/LoginTitle.vue";
</script>

<template>
  <GameBackground class="fixed z-0" />
  <div
    class="fixed inset-0 z-1 flex flex-col items-center justify-center gap-[8vmin] overflow-y-auto no-scrollbar pointer-events-none"
  >
    <LoginTitle />
    <HomeMenu />
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
