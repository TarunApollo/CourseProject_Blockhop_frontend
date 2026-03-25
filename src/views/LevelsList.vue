<script setup>
import LevelListElement from "../components/LevelListElement.vue"
import tempLevelsList from "../stores/tempLevelsStore"
</script>
<template>
    <header class="sorting-header">
        Sorting by:
        <div class="inline-dropdown"> Hello
            <div class="dropdown-content"> <!-- Make sure to add @click for buttons to refetch the levels by popularity/name/clear rate -->
                <button>Name</button>
                <button>Popularity</button>
                <button>Clear rate</button>
            </div>
        </div>  
    </header>
    <!-- Sorting buttons / dropdown go in here -->
    <div class="levels-list">
        <div v-for="element in tempLevelsList.tempLevelsList" :key="element.id">
            <LevelListElement :level="element"/>
        </div>
    </div>
</template>
<style scoped>

@import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@700&display=swap');

    button {
        font-family: 'Pixelify Sans', monospace;
        font-size: 1.5rem;
    }

    .levels-list {
        margin: 0.5em, 0.5em, 0.5em, 0.5em;
        padding: 1em;
        display: grid;
        grid-template-columns: 30% 30% 30%;
        gap: 1em;
        justify-content: space-evenly;
    }
    
    .menu-grid {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: min(450px, 90vw);
        margin: auto;
        display: grid;
        grid-template-columns: repeat(1, minmax(100px, 1fr));
        gap: 2px;
        pointer-events: all;
        margin-top: 25vh;
        margin-bottom: 5vh;
    }

    .dropdown-content {
        display: none;
        position: absolute;
        background-color: #f9f9f9;
        min-width: 130px;
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
        padding: 12px 16px;
    }

    .sorting-header {
        font-family: 'Pixelify Sans', monospace;
        font-size: 1.5rem;
        margin-bottom: 1em;
        margin-top: 1em;
    }

    .inline-dropdown {
        display: inline;
        font-family: 'Pixelify Sans', monospace;
        font-size: 1.5rem;
    }

    .inline-dropdown:hover .dropdown-content {
        display: block;
    }

</style>