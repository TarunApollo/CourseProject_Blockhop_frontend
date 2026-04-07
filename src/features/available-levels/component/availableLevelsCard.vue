<script setup>
defineProps({
  level: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <article>
    <h3>{{ level.title || 'Untitled level' }}</h3>
    <p>{{ level.description || 'No description provided.' }}</p>
  </article>
</template>
