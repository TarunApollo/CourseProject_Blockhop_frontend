<script setup>
import LevelListElement from "../components/LevelListElement.vue"
import tempLevelsList from "../stores/tempLevelsStore"
import ReturnButton from "@/shared/components/ReturnButton.vue";
import MainLogo from "@/shared/components/MainLogo.vue";

</script>
<template>
    <ReturnButton/>
    <MainLogo/>

    <header class="sorting-header">
        Sorting by:
        <div class="inline-dropdown"> Does not do anything, yet
            <div class="dropdown-content"> <!-- Make sure to add @click for buttons to refetch the levels by popularity/name/clear rate -->
                <button>Name</button>
                <button>Popularity</button>
                <button>Clear rate</button>
            </div>
        </div>  
    </header>
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
        position: relative;
        cursor: pointer;
    }

    .dropdown-content {
        display: none;
        position: absolute;
        background-color: #f9f9f9;
        min-width: clamp(120px, 25vw, 250px);
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
        padding: clamp(8px, 2vw, 16px) clamp(12px, 2.5vw, 20px);
        z-index: 100;
        top: 100%;
        left: 0;
        border-radius: clamp(4px, 1vw, 8px);
    }

    .dropdown-content button {
        display: block;
        width: 100%;
        padding: clamp(6px, 1.5vw, 10px) clamp(8px, 2vw, 12px);
        margin: clamp(4px, 0.5vw, 6px) 0;
        background-color: #e8f5e9;
        border: 2px solid #4ade80;
        border-radius: clamp(3px, 0.5vw, 5px);
        cursor: pointer;
        font-size: clamp(0.7rem, 1.5vw, 1.2rem);
        transition: all 0.2s ease;
    }

    .dropdown-content button:hover {
        background-color: #4ade80;
        color: white;
        transform: translateX(4px);
    }

    .sorting-header {
        font-family: 'Pixelify Sans', monospace;
        font-size: clamp(0.5rem, 2vw, 3rem);
        margin-bottom: 1em;
        margin-top: clamp(7.5rem, 2vw, 3rem);
        margin-left: clamp(0.2rem, 2vw, 3rem);
        position: relative;
    }

    .inline-dropdown {
        display: inline-block;
        position: relative;
        font-family: 'Pixelify Sans', monospace;
        font-size: clamp(0.5rem, 2vw, 3rem);
        cursor: pointer;
    }

    .inline-dropdown:hover .dropdown-content {
        display: block;
    }

</style>