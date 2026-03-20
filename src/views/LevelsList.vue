<script setup>
import LevelListElement from "../components/LevelListElement.vue"
import tempLevelsList from "../stores/tempLevelsStore"
</script>
<template>
    <!-- Sorting buttons / accordion go in here -->
    <div class="levels-list">
        <div v-for="element in tempLevelsList.tempLevelsList" :key="element.id">
            <LevelListElement :level="element"/>
        </div>
    </div>
</template>
<style scoped>
    .levels-list {
        margin: 0.5em, 0.5em, 0.5em, 0.5em;
        padding: 1em;
        display: grid;
        grid-template-columns: 30% 30% 30%;
        gap: 1em;
        justify-content: space-evenly;
    }
</style>