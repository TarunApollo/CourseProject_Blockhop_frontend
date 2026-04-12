<script setup>
import HomeMenu from "@/features/home/components/HomeMenu.vue";
import GameBackground from "@/shared/components/GameBackground.vue";
import LoginTitle from "@/features/login-page/components/LoginTitle.vue";
</script>

<template>
  <div
    class="relative min-h-screen h-screen flex flex-col items-center justify-center overflow-hidden"
  >
    <GameBackground class="fixed inset-0 z-0" />

    <div
      class="relative z-1 flex flex-col items-center justify-center gap-[6vh] w-full max-h-full overflow-y-auto no-scrollbar py-[5vh]"
    >
      <LoginTitle />
      <HomeMenu />
    </div>
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
