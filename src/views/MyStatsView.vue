<script setup>
import ReturnButton from "@/shared/components/ReturnButton.vue"
import MainLogo from "@/shared/components/MainLogo.vue";
import "@/style/MyStatsView.css";
</script>
<template>

  <ReturnButton style="z-index: 100"/>
  <MainLogo/>
  <div class="overlay">
    
    <div class="stats-content">
      <h1 class="view-title">My Stats</h1>
      <p class="view-text">Here you can view your game statistics and achievements.</p>
      <!-- Add more stats content here -->
    </div>
  </div>
</template>