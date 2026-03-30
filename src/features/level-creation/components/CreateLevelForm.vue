<script setup>
import { useCreateLevelForm } from '@/features/level-creation/composables/useCreateLevelForm'

const emit = defineEmits(['created'])

const { title, description, isSubmitting, submitError, handleSubmit } = useCreateLevelForm(
  (createdLevel) => emit('created', createdLevel),
)

</script>
<template>
  <div>Hello world</div>
</template>

<style scoped>
</style>
