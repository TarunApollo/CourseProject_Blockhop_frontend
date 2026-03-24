<script setup lang="ts">
import { useCreateLevelForm } from '@/features/level-creation/composables/useCreateLevelForm'
import type { LevelResponse } from '@/features/level-creation/lib/types'

const emit = defineEmits<{
  created: [createdLevel: LevelResponse]
}>()

const { title, description, isSubmitting, submitError, handleSubmit } = useCreateLevelForm(
  (createdLevel) => emit('created', createdLevel),
)

</script>
<template>
  <div>Hello world</div>
</template>

<style scoped>
</style>
