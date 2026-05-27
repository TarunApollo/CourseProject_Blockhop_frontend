<script setup>
defineProps({
  modelValue: { type: Boolean, default: true },
  size: { type: String, default: "lg" },   // 'sm' | 'lg'
  label: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
  variant: { type: String, default: "rect" }, // 'rect' | 'pill'
});

defineEmits(["update:modelValue"]);
</script>

<template>
  <label
    class="flex items-center gap-3 select-none"
    :class="disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'"
  >
    <!-- real form control, accessible to screen readers -->
    <input
      type="checkbox"
      class="sr-only"
      :checked="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', $event.target.checked)"
    />

    <!-- ── RECT variant (pause menu) ── -->
    <!-- Two labeled halves; a semi-transparent white band slides onto the    -->
    <!-- active side, washing it out so the saturated inactive side pops.    -->
    <div
      v-if="variant === 'rect'"
      :class="[
        'relative flex overflow-hidden border-2 border-gray-600 shrink-0',
        size === 'sm' ? 'w-28 h-9' : 'w-40 h-12',
      ]"
    >
      <div
        :class="[
          'flex-1 flex items-center justify-center font-bold text-black bg-red-500',
          size === 'sm' ? 'text-xs' : 'text-sm',
        ]"
      >
        OFF
      </div>
      <div
        :class="[
          'flex-1 flex items-center justify-center font-bold text-black bg-game-primary',
          size === 'sm' ? 'text-xs' : 'text-sm',
        ]"
      >
        ON
      </div>
      <!-- sliding cover: hides the inactive side so only the active label shows -->
      <div
        class="absolute inset-y-0 w-1/2 bg-white transition-transform duration-200"
        :class="modelValue ? 'translate-x-0' : 'translate-x-full'"
      />
    </div>

    <!-- ── PILL variant (level card) ── -->
    <!-- Black rounded track; a white oval thumb slides L↔R.                -->
    <!-- "ON" (green) sits on the left, "OFF" (red) on the right — each     -->
    <!-- label is revealed when the thumb moves to the opposite side.        -->
    <div
      v-else
      :class="[
        'relative overflow-hidden rounded-full bg-black border-2 border-gray-600 shrink-0',
        size === 'sm' ? 'w-24 h-8' : 'w-32 h-10',
      ]"
    >
      <!-- ON label: left side, visible when thumb is on the right (ON) -->
      <span
        class="absolute left-2 inset-y-0 flex items-center font-bold text-game-primary"
        :class="size === 'sm' ? 'text-xs' : 'text-sm'"
      >ON</span>
      <!-- OFF label: right side, visible when thumb is on the left (OFF) -->
      <span
        class="absolute right-2 inset-y-0 flex items-center font-bold text-red-400"
        :class="size === 'sm' ? 'text-xs' : 'text-sm'"
      >OFF</span>
      <!-- sliding oval thumb — sits above labels via DOM order -->
      <div
        class="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-white shadow-md transition-transform duration-200"
        :class="modelValue ? 'translate-x-full' : 'translate-x-0'"
      />
    </div>

    <span
      v-if="label"
      :class="[
        'font-bold uppercase tracking-wide',
        size === 'sm' ? 'text-xs' : 'text-sm',
      ]"
    >
      {{ label }}
    </span>
  </label>
</template>
