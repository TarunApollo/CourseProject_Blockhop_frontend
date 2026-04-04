<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }

  router.push('/home')
}
</script>

<template>
  <div class="shared-return-button">
    <div class="return-button absolute left-7 top-7 z-100">
        <button class="back-button cursor-pointer whitespace-nowrap border-2 border-solid border-(--color-ink-strong) bg-(--color-game-primary) px-[clamp(15px,5vw,15px)] py-[clamp(8px,2vw,8px)] text-center text-[clamp(0.2rem,3.4vw,4rem)] font-bold text-(--color-game-primary-ink) shadow-(--shadow-game-raised) transition-transform duration-75 hover:-translate-y-0.5 hover:bg-(--color-game-primary-hover) active:translate-y-0 [font-family:var(--font-game)]" type="button" @click="goBack">&#8592;</button>
    </div>
  </div>
</template>