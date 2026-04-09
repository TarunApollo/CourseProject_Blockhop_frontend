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
    <div class="return-button absolute left-10 top-10 z-100">
        <button class="back-button level-ui-button border-1 px-[clamp(20px,5vw,15px)] py-[clamp(12px,2vw,8px)] text-[clamp(0.2rem,3.4vw,4rem)] text-(--color-game-primary-ink)" type="button" @click="goBack">&#8592;</button>
    </div>
  </div>
</template>