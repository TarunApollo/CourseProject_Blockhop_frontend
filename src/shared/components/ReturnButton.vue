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
        <button class="back-button level-ui-button border-2 px-[clamp(15px,5vw,15px)] py-[clamp(8px,2vw,8px)] text-[clamp(0.2rem,3.4vw,4rem)] text-(--color-game-primary-ink)" type="button" @click="goBack">&#8592;</button>
    </div>
  </div>
</template>