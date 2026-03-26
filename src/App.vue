<script setup>
import { RouterView } from 'vue-router'
import GameBackground from './shared/components/GameBackground.vue';
import './style/sharedViews.css'
</script>

<template>
  <GameBackground z-index="-1"/>
  <RouterView />
</template>

<style scoped>
</style>