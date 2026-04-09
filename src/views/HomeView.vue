<script setup>
// Add or update the post-login main page route/page.
import MainLogo from '@/shared/components/MainLogo.vue';
import GameBackground from '@/shared/components/GameBackground.vue';
import homeMenuGrid from '@/features/home-page/components/home-menu-grid.vue';
</script>

<template>
  <GameBackground/>
  <div class="view-home home fixed inset-0 overflow-hidden">

    <div class="overlay">
      <MainLogo/>
      <homeMenuGrid/>
    </div>
  </div>
</template>