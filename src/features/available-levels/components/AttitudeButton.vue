<script setup>
import ThumbIcon from "@/shared/components/icons/ThumbIcon.vue";

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (value) => ["like", "dislike"].includes(value),
  },
  count: { type: Number, required: true },
  active: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["click"]);

function buttonClasses() {
  return [
    "inline-flex items-center gap-2 rounded p-1 transition-opacity duration-100",
    "select-none border-none outline-none focus:outline-none focus:ring-0",
    "bg-transparent text-[#1F3B17]",
    props.disabled ? "cursor-wait opacity-60" : "cursor-pointer",
  ];
}
</script>

<template>
  <button
    :class="buttonClasses()"
    type="button"
    :aria-label="type === 'like' ? 'Like level' : 'Dislike level'"
    :aria-pressed="active"
    :disabled="disabled"
    @click.stop="emit('click')"
  >
    <ThumbIcon
      :direction="type === 'like' ? 'up' : 'down'"
      :filled="active"
      class="h-10 w-10"
      :class="active ? 'opacity-100' : 'opacity-60'"
    />
    <span class="min-w-4 text-left font-number-prop text-xs font-bold">
      {{ count }}
    </span>
  </button>
</template>

<style scoped>
button {
  -webkit-tap-highlight-color: transparent;
}

button:disabled {
  pointer-events: none;
}
</style>
