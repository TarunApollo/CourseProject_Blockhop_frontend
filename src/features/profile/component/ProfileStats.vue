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
      class="border-2 border-[#4A6A46] bg-[#7BE089] p-5 shadow-[0_5px_0_rgba(36,61,29,0.35)]"
  >
    <p class="text-sm uppercase tracking-[0.22em] text-[#2F5A28]">
      {{ label }}
    </p>

    <p class="mt-3 text-5xl leading-none text-[#1F3B17]">
      {{ value }}
    </p>

    <div class="mt-4 h-3 w-full bg-[#9BEA9A]"></div>

    <p class="mt-4 text-base text-[#23401A]">
      Keep exploring to grow this number.
    </p>
  </article>
</template>
