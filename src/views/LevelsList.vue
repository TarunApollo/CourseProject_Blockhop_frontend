<script setup>
import LevelListElement from "../components/LevelListElement.vue"
import tempLevelsList from "../stores/tempLevelsStore"
import GameBackground from "../components/GameBackground.vue"
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }

  router.push('/home')
}
</script>
<template>
    <!-- <GameBackground /> -->
    <div class="return-button">
        <button class="menu-button" type="button" @click="goBack">&#8592;</button>
    </div>
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

    .return-button {
        pointer-events: auto;
        position: absolute;
        top: 28px;
        left: 28px;
    }

    .menu-button {
        padding: clamp(8px, 2vw, 8px) clamp(15px, 5vw, 15px);
        background: #4ade80;
        color: #052e16;
        border: #181818 2px solid;
        font-family: 'Pixelify Sans', monospace;
        font-size: clamp(0.2rem, 3.4vw, 4rem);
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        box-shadow: 0 5px 0 #166534, 0 8px 18px rgba(0,0,0,0.25);
        transition: transform 0.07s, box-shadow 0.07s;
        text-align: center;
    }

    .menu-button:hover {
        transform: translateY(-2px);
        background: #86efac;
    }

    .menu-button:active {
        transform: translateY(0);
    }
</style>