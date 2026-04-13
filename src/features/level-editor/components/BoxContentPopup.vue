<script setup>
const props = defineProps({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  tileSize: { type: Number, required: true },
  currentContent: { type: String, default: null },
});

const emit = defineEmits(["select", "close"]);

const coins = [
  { key: "gold", gid: 109, label: "Gold", value: 100 },
  { key: "silver", gid: 119, label: "Silver", value: 25 },
  { key: "bronze", gid: 129, label: "Bronze", value: 5 },
];

const popupStyle = {
  left: `${(props.x + 1) * props.tileSize + 6}px`,
  top: `${props.y * props.tileSize}px`,
};

function getCoinPreviewStyle(gid) {
  const size = 20;
  const id = gid - 1;
  const col = id % 10;
  const row = Math.floor(id / 10);
  const scale = size / 128;

  return {
    width: `${size}px`,
    height: `${size}px`,
    backgroundImage: "url(/assets/tiles.png)",
    backgroundSize: `${1280 * scale}px ${2560 * scale}px`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: `-${col * 128 * scale}px -${row * 128 * scale}px`,
  };
}
</script>

<template>
  <div
    class="box-content-popup absolute z-50 bg-[#1a1a2e] border border-[#5A7E4B] rounded-lg shadow-xl p-1.5 flex gap-1"
    :style="popupStyle"
    @mousedown.stop
  >
    <button
      v-for="coin in coins"
      :key="coin.key"
      class="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#2a2a4e] cursor-pointer transition-colors"
      :class="{ 'bg-[#5A7E4B]/30 ring-1 ring-[#5A7E4B]': currentContent === coin.key }"
      :title="`${coin.label} (${coin.value} pts)`"
      @click="emit('select', coin.key)"
    >
      <div :style="getCoinPreviewStyle(coin.gid)" class="shrink-0" />
      <span class="text-white text-xs font-medium">{{ coin.value }}</span>
    </button>

    <button
      v-if="currentContent"
      class="flex items-center justify-center px-2 py-1 rounded hover:bg-red-900/50 cursor-pointer transition-colors text-white/60 hover:text-white"
      title="Clear content"
      @click="emit('select', null)"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>
