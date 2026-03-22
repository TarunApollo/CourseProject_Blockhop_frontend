<script setup>
defineProps({
  level: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="flex flex-col border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-base font-semibold text-gray-900 truncate">{{ level.title || 'Untitled Level' }}</h3>
      <span
          :class="level.published
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'"
          class="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ml-2"
      >
                {{ level.published ? 'Published' : 'Draft' }}
            </span>
    </div>
    <p class="text-sm text-gray-500 line-clamp-2">
      {{ level.description || 'No description' }}
    </p>
  </div>
</template>
