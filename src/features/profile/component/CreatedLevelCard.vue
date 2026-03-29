<script setup>
defineProps({
  level: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <article
      class="border-2 border-[#4A6A46] bg-[#7BE089] p-4 shadow-[0_5px_0_rgba(36,61,29,0.35)]"
  >
    <div class="mb-4 border-2 border-[#7CCB8A] bg-[#85DFA2] px-4 py-8 text-center text-[#2F5A28]">
      LEVEL PREVIEW
    </div>

    <div class="flex items-start justify-between gap-3">
      <h3 class="min-w-0 text-2xl text-[#1F3B17] truncate">
        {{ level.title || 'Untitled Level' }}
      </h3>

      <span
          :class="
          level.published
            ? 'bg-[#B8F4A6] text-[#204817] border-[#6AA85E]'
            : 'bg-[#FFF2A6] text-[#6F5815] border-[#D8C451]'
        "
          class="shrink-0 border-2 px-3 py-1 text-sm"
      >
        {{ level.published ? 'Published' : 'Draft' }}
      </span>
    </div>

    <p class="mt-3 text-base text-[#23401A]">
      Times played: 0 - Completes: 0
    </p>

    <p class="mt-2 min-h-12 text-base text-[#23401A]">
      {{ level.description || 'No description yet for this level.' }}
    </p>

    <div class="mt-4 h-3 w-full bg-[#9BEA9A]"></div>

    <p class="mt-3 text-sm text-[#2F5A28]">
      {{ level.published ? 'Visible to players' : 'Hidden from players' }}
    </p>
  </article>
</template>
