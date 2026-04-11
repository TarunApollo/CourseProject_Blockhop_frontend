<script setup>
import ReturnButton from "@/shared/components/ReturnButton.vue";
import MainLogo from "@/shared/components/MainLogo.vue";
import GameBackground from "@/shared/components/GameBackground.vue";
</script>
<template>
  <div class="view-levels-list relative">
    <GameBackground />
    <ReturnButton />

    <div
      class="relative z-10 mx-auto flex w-full max-w-[2000px] max-h-[100vh] flex-col items-center px-[clamp(0.0rem,2vw,1rem)]"
    >
      <MainLogo />
      <div class="h-[4.0rem]"></div>

      <header
        class="sorting-header w-fit text-center text-[clamp(1.0rem,1.7vw,2rem)] text-(--color-ink-strong) [font-family:var(--font-game)]"
      >
        Sorting by:
        <div
          class="inline-dropdown group relative inline-block cursor-pointer text-[clamp(1.0rem,1.7vw,2rem)] [font-family:var(--font-game)]"
        >
          Does not do anything, yet
          <div
            class="dropdown-content level-ui-dropdown-panel absolute inset-0 z-100 hidden group-hover:block"
          >
            <button
              class="level-ui-dropdown-option level-ui-dropdown-option-hover ml-0 mr-[0.5vw] px-[0.25rem] py-[0.10rem] text-[clamp(0.35rem,0.5vw,0.55rem)] leading-none"
            >
              Popularity
            </button>
            <button
              class="level-ui-dropdown-option level-ui-dropdown-option-hover ml-0 mr-[0.5vw] px-[0.25rem] py-[0.10rem] text-[clamp(0.35rem,0.5vw,0.55rem)] leading-none"
            >
              Clear rate
            </button>
          </div>
        </div>
      </header>
      <div class="h-[15rem]"></div>

      <div
        class="levels-list relative flex max-h-[70vh] w-full cursor-pointer flex-wrap justify-center gap-[5em] overflow-scroll p-[1em]"
      >
        <LevelListElement v-for="value in 11" :key="value.id" :level="value" />
      </div>
    </div>
  </div>
</template>
