<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
  icon: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="flex items-center gap-4 bg-white/70 border-2 border-green-400 rounded-2xl p-5 min-w-[180px] hover:shadow-lg transition-shadow">
    <span v-if="icon" class="text-3xl">{{ icon }}</span>
    <div class="flex flex-col">
      <span class="text-3xl font-bold text-green-800 leading-none">{{ value }}</span>
      <span class="text-sm text-green-600 mt-1">{{ label }}</span>
    </div>
  </div>
</template>