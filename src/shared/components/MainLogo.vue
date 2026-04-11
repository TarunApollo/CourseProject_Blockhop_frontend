<script setup></script>

<template>
  <div class="relative flex justify-center">
    <h1 class="text-[clamp(8vw,9vw,10vw)] game-title text-center font-bold">
      <span
        class="bg-linear-to-b from-home-btn-dirt-light to-home-btn-dirt-dark bg-clip-text text-transparent"
        >Block</span
      ><span
        class="bg-linear-to-b from-home-btn-grass-light to-home-btn-grass-dark bg-clip-text text-transparent"
        >hop</span
      >
    </h1>
  </div>
</template>

<style scoped>
.game-title {
  filter: drop-shadow(0 3px 0 var(--color-home-btn-border));
  paint-order: stroke fill;
  -webkit-text-stroke: 3px var(--color-home-btn-border);
}
</style>
