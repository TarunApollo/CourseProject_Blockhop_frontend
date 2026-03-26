<script setup>
import ReturnButton from "@/shared/components/ReturnButton.vue"
import MainLogo from "@/shared/components/MainLogo.vue"
import '@/style/AboutView.css'
</script>

<template>
  <ReturnButton/>

  <div class="overlay">
  <MainLogo/>
    
    <div class="about-content">
      <h1 class="view-title">About information</h1>
      <p class="view-text">Here you can view information about the game and its development.</p>
      <!-- Add about content here -->
    </div>
  </div>
</template>