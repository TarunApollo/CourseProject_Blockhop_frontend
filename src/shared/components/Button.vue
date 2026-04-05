<script setup>
defineProps({
  isLoading: Boolean,
  text: String,
  textAfterClick: String
})
</script>

<template>
  <button
      class="px-13.75 py-6.25 bg-green-400 text-green-950 border-2 border-[#181818]
            font-pixelify text-[1.1rem] font-bold cursor-pointer whitespace-nowrap
            shadow-[0_5px_0_#166534,0_8px_18px_rgba(0,0,0,0.25)]
            transition-[transform,box-shadow] duration-70
            hover:bg-[#86efac] hover:-translate-y-0.75 hover:shadow-[0_8px_0_#166534,0_12px_24px_rgba(0,0,0,0.28)]
            active:translate-y-1 active:shadow-[0_1px_0_#166534]
            disabled:opacity-55 disabled:cursor-not-allowed"
      :disabled="isLoading"
  >
    <span v-if="!isLoading">{{ text }}</span>
    <span v-else class="flex items-center gap-2.25">
            <span class="w-3.25 h-3.25 border-2 border-green-950/20 border-t-green-950 rounded-full animate-spin" />
            {{ textAfterClick }}
          </span>
  </button>
</template>

<style scoped>

</style>