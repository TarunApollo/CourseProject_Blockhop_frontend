<template>
  <div
    class="relative inline-flex flex-col items-center justify-center select-none text-center"
  >
    <h1
      class="text-[clamp(5rem,10vw,10rem)] leading-none font-bold animate-[title-wobble_6s_ease-in-out_infinite_alternate] whitespace-nowrap"
    >
      <span class="title-block">Block</span><span class="title-hop">hop</span>
    </h1>

    <span
      class="absolute bottom-[-20%] right-[-10%] rotate-330 text-[clamp(1.2rem,1.5vw,1.2rem)] font-bold whitespace-nowrap pointer-events-none origin-left animate-[splash-pulse_1.2s_ease-in-out_infinite_alternate] splash-text"
    >
      Stay home and play games!
    </span>
  </div>
</template>

<style scoped>
.title-block {
  color: var(--color-white);
  text-shadow:
    3px 3px 0 var(--color-forest),
    5px 5px 0 rgba(0, 0, 0, 0.25);
}

.title-hop {
  color: var(--color-game-primary);
  text-shadow:
    3px 3px 0 var(--color-game-primary-shadow),
    5px 5px 0 rgba(0, 0, 0, 0.25);
}

.splash-text {
  color: #ffe03a;
  text-shadow:
    2px 2px 0 #7a5a00,
    0 0 12px rgba(255, 224, 58, 0.8);
}
</style>
