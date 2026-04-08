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
            <div class="dropdown-content level-ui-dropdown-panel absolute left-0 top-full z-100 hidden group-hover:block">
                <button class="level-ui-dropdown-option level-ui-dropdown-option-hover ml-0 mr-[0.5vw]">Popularity</button>
                <button class="level-ui-dropdown-option level-ui-dropdown-option-hover ml-0 mr-[0.5vw]">Clear rate</button>
            </div>
        </div>
    </header>
    <!-- Ensure the layout can render multiple level entries. -->
    <div class="levels-list relative mx-auto my-[0.5em] flex max-h-[70vh] w-[min(100%,1200px)] cursor-pointer flex-wrap justify-center gap-[1em] overflow-scroll p-[1em]">
        <LevelListElement  v-for="value in 11" :key="value.id" :level="value"/>
    </div>
  </div>
</template>