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
      class="rounded-[1.75rem] border-4 border-slate-900/10 bg-white/90 p-5 shadow-[0_10px_0_rgba(148,163,184,0.18)] transition hover:-translate-y-1 hover:shadow-[0_14px_0_rgba(148,163,184,0.22)]"
  >
    <div class="mb-4 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-xs uppercase tracking-[0.22em] text-emerald-700">Level</p>
        <h3 class="truncate text-xl text-slate-900">
          {{ level.title || 'Untitled Level' }}
        </h3>
      </div>

      <span
          :class="
          level.published
            ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
            : 'border-amber-200 bg-amber-100 text-amber-800'
        "
          class="shrink-0 rounded-full border-2 px-3 py-1 text-xs uppercase tracking-[0.18em]"
      >
        {{ level.published ? 'Published' : 'Draft' }}
      </span>
    </div>

    <p class="min-h-16 text-sm leading-6 text-slate-600">
      {{ level.description || 'No description yet for this level.' }}
    </p>

    <div class="mt-5 flex items-center justify-between border-t-2 border-slate-100 pt-4">
      <span class="text-xs uppercase tracking-[0.18em] text-slate-400">Creator Space</span>
      <span class="text-sm text-slate-500">
        {{ level.published ? 'Visible to players' : 'Hidden from players' }}
      </span>
    </div>
  </article>
</template>
