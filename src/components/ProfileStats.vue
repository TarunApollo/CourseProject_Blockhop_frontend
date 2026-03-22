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
  <div class="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl p-5 min-w-[180px] hover:shadow-md transition-shadow">
    <span v-if="icon" class="text-3xl">{{ icon }}</span>
    <div class="flex flex-col">
      <span class="text-3xl font-bold text-gray-900 leading-none">{{ value }}</span>
      <span class="text-sm text-gray-500 mt-1">{{ label }}</span>
    </div>
  </div>
</template>
