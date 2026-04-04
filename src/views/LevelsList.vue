<script setup>
// Provide a dedicated container/section for the list of available levels.
import LevelListElement from "../features/level-list-element/components/LevelListElement.vue"
import ReturnButton from "@/shared/components/ReturnButton.vue";
import MainLogo from "@/shared/components/MainLogo.vue";
import GameBackground from "@/shared/components/GameBackground.vue";
</script>
<template>
    <div class="view-levels-list">
    <ReturnButton/>
    <MainLogo/>
    <GameBackground/>
    <header class="sorting-header relative ml-[clamp(0.2rem,2vw,3rem)] mt-[10rem] mb-[1em] text-[clamp(0.5rem,2vw,3rem)] text-(--color-ink-strong) [font-family:var(--font-game)]">
        Sorting by:
        <div class="inline-dropdown group relative inline-block cursor-pointer text-[clamp(0.5rem,2vw,3rem)] [font-family:var(--font-game)]"> Does not do anything, yet
            <div class="dropdown-content absolute left-0 top-full z-100 hidden min-w-[clamp(120px,25vw,250px)] rounded-[clamp(4px,1vw,8px)] bg-(--color-surface-dropdown) px-[clamp(12px,2.5vw,20px)] py-[clamp(8px,2vw,16px)] shadow-(--shadow-overlay-md) group-hover:block">
                <button class="mt-[clamp(4px,1vw,8px)] mb-[6px] ml-0 mr-[0.5vw] block w-full rounded-[clamp(3px,0.5vw,5px)] border-2 border-solid border-(--color-game-primary) bg-(--color-surface-dropdown-button) px-[clamp(8px,2vw,12px)] py-[clamp(6px,1.5vw,10px)] text-[clamp(0.7rem,1.5vw,1.2rem)] transition-all duration-200 ease-[ease] hover:translate-x-1 hover:bg-(--color-game-primary) hover:text-(--color-white) [font-family:var(--font-game)]">Popularity</button>
                <button class="mt-[clamp(4px,1vw,8px)] mb-[6px] ml-0 mr-[0.5vw] block w-full rounded-[clamp(3px,0.5vw,5px)] border-2 border-solid border-(--color-game-primary) bg-(--color-surface-dropdown-button) px-[clamp(8px,2vw,12px)] py-[clamp(6px,1.5vw,10px)] text-[clamp(0.7rem,1.5vw,1.2rem)] transition-all duration-200 ease-[ease] hover:translate-x-1 hover:bg-(--color-game-primary) hover:text-(--color-white) [font-family:var(--font-game)]">Clear rate</button>
            </div>
        </div>
    </header>
    <!-- Ensure the layout can render multiple level entries. -->
    <div class="levels-list relative mx-auto my-[0.5em] flex max-h-[70vh] w-[min(100%,1200px)] cursor-pointer flex-wrap justify-center gap-[1em] overflow-scroll p-[1em]">
        <LevelListElement  v-for="value in 11" :key="value.id" :level="value"/>
    </div>
  </div>
</template>