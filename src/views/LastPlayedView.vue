<script setup>
import MainLogo from "@/shared/components/MainLogo.vue";
import ReturnButton from "@/shared/components/ReturnButton.vue";
import '@/assets/viewsStyle/LastPlayedView.css';
</script>

<template>
  <ReturnButton />
  <div class="overlay">
    <MainLogo/>
    
    <div class="last-played-content">
      <h1 class="view-title">Resume your last played level</h1>
      <!-- Fetch the last played level from the backend and display it here -->
    </div>
  </div>
</template>