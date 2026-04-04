<script setup>
// Add or update the post-login main page route/page.
import MainLogo from '@/shared/components/MainLogo.vue';
import GameBackground from '@/shared/components/GameBackground.vue';

const menuButtonClass =
  'menu-button block cursor-pointer whitespace-nowrap border border-(--color-ink-strong) bg-(--color-game-primary) px-[clamp(15px,5vw,15px)] py-[clamp(8px,2vw,8px)] text-center text-[clamp(0.2rem,2.3vw,4rem)] font-bold shadow-(--shadow-game-raised) transition-transform duration-75 hover:-translate-y-0.5 hover:bg-(--color-game-primary-hover) active:translate-y-0 [font-family:var(--font-game)]';
</script>

<template>
  <GameBackground/>
  <div class="view-home home fixed inset-0 overflow-hidden">

    <div class="overlay">
      <MainLogo/>

      <div class="menu-grid absolute left-2/4 top-[55%] grid w-[min(450px,90vw)] -translate-x-2/4 -translate-y-2/4 grid-cols-[repeat(1,minmax(100px,1fr))] items-center justify-center gap-3 [pointer-events:all] max-[768px]:grid-cols-[1fr] max-[480px]:grid-cols-[1fr]">
        <RouterLink to="/profile" :class="menuButtonClass" style="color: var(--color-ink-strong);">Profile</RouterLink>
        <RouterLink to="/level-list" :class="menuButtonClass" style="color: var(--color-ink-strong);">Levels</RouterLink>
        <RouterLink to="/play" :class="menuButtonClass" style="color: var(--color-ink-strong);">Play Level</RouterLink>
      </div>
    </div>
  </div>
</template>