<script setup>
import { RouterView } from "vue-router";
import GameBackground from "@/shared/components/GameBackground.vue";
</script>

<template>
  <div class="min-h-screen text-slate-900">
    <GameBackground />
    <main class="w-full h-screen relative z-10 pointer-events-none">
      <div class="w-full h-full pointer-events-auto">
        <RouterView />
      </div>
    </main>
  </div>
</template>
