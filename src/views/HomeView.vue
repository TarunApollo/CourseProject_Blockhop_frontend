<script setup>
import MainLogo from '@/shared/components/MainLogo.vue';
import '@/assets/viewsStyle/HomeView.css';
</script>

<template>
  <div class="home">

    <div class="overlay">
      <MainLogo/>

      <div class="menu-grid">
        <RouterLink to="/my-stats" class="menu-button">My Stats</RouterLink>
        <RouterLink to="/last-played" class="menu-button">Resume Last Played</RouterLink>
        <RouterLink to="/level-list" class="menu-button">Levels</RouterLink>
        <RouterLink to="/play-demo" class="menu-button">Play Demo</RouterLink>
        <RouterLink to="/about" class="menu-button">About</RouterLink>
      </div>
    </div>
  </div>
</template>