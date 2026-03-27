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
  <article
      class="min-w-[220px] flex-1 rounded-[1.75rem] border-4 border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-sky-100 p-5 shadow-[0_10px_0_rgba(16,185,129,0.18)] transition hover:-translate-y-1"
  >
    <div class="flex items-start gap-4">
      <div
          class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-4 border-emerald-200 bg-emerald-300 text-3xl shadow-[0_6px_0_rgba(22,101,52,0.18)]"
      >
        <span aria-hidden="true">{{ icon }}</span>
      </div>

      <div class="min-w-0">
        <p class="text-sm uppercase tracking-[0.2em] text-emerald-700">
          {{ label }}
        </p>
        <p class="mt-2 text-4xl leading-none text-slate-900">
          {{ value }}
        </p>
        <p class="mt-2 text-sm text-slate-600">
          Keep exploring to grow this number.
        </p>
      </div>
    </div>
  </article>
</template>
