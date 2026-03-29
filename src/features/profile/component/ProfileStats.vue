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
})
</script>

<template>
  <article
      class="min-w-[220px] flex-1 rounded-[1.75rem] border-4 border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-sky-100 p-5 shadow-[0_10px_0_rgba(16,185,129,0.18)] transition hover:-translate-y-1"
  >
    <div class="flex h-full flex-col justify-between gap-3">
      <div>
        <p class="text-sm uppercase tracking-[0.2em] text-emerald-700">
          {{ label }}
        </p>
        <p class="mt-2 text-4xl leading-none text-slate-900">
          {{ value }}
        </p>
      </div>

      <p class="text-sm text-slate-600">
        Keep exploring to grow this number.
      </p>
    </div>
  </article>
</template>
