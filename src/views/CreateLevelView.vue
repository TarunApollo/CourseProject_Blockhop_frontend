<script setup>
import { useRouter } from 'vue-router'
import CreateLevelForm from '@/features/level-creation/components/CreateLevelForm.vue'
import BackButton from '@/shared/components/BackButton.vue'

const router = useRouter()

function onLevelCreated(createdLevel) {
  router.replace({ name: 'Level Editor', params: { levelId: createdLevel.id } })
}
</script>

<template>
  <div class="fixed inset-0 w-screen h-screen overflow-hidden">
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute left-4 top-4 z-20 pointer-events-auto sm:left-6 sm:top-5">
        <BackButton />
      </div>

      <div class="flex h-full items-center justify-center px-4 pointer-events-auto">
        <CreateLevelForm @created="onLevelCreated" />
      </div>
    </div>
  </div>
</template>
