<script setup>
import { useRouter } from 'vue-router'
import '@/shared/style/ReturnButton.css'

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
    <div class="return-button">
        <button class="back-button" type="button" @click="goBack">&#8592;</button>
    </div>
</template>