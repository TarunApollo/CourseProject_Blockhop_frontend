<script setup>
defineProps({
  direction: {
    type: String,
    default: "up",
    validator: (value) => ["up", "down"].includes(value),
  },
  filled: { type: Boolean, default: false },
});
</script>

<template>
  <svg
    aria-hidden="true"
    class="block"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    :stroke-width="filled ? 0 : 2.4"
  >
    <g :transform="direction === 'down' ? 'rotate(180 12 12)' : undefined">
      <path
        v-if="filled"
        fill="currentColor"
        d="M8.8 20.4h8.45c1.2 0 2.22-.82 2.48-1.99l1.37-6.18A2.54 2.54 0 0 0 18.62 9.1h-4.76l.58-2.8c.19-.94-.04-1.91-.64-2.67l-.32-.4a1.33 1.33 0 0 0-2.19.16L7.54 9.57c-.2.33-.3.71-.3 1.09v7.95c0 .99.65 1.79 1.56 1.79ZM3 20.4h2.6V9.8H3a1 1 0 0 0-1 1v8.6a1 1 0 0 0 1 1Z"
      />
      <path
        v-else
        d="M6.7 20.2H3.6a1.4 1.4 0 0 1-1.4-1.4v-7.7a1.4 1.4 0 0 1 1.4-1.4h3.1v10.5Zm0 0h10.45c1.05 0 1.96-.73 2.19-1.76l1.34-6.02a2.25 2.25 0 0 0-2.19-2.74h-4.92l.63-3.03c.17-.82-.03-1.67-.55-2.32l-.34-.43a1.08 1.08 0 0 0-1.78.13L7.34 9.54c-.42.68-.64 1.46-.64 2.25v8.41Z"
      />
    </g>
  </svg>
</template>
