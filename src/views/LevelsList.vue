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
    <GameBackground style="z-index: -1;"/>
    <div class="return-button">
      <button class="back-button" type="button" @click="goBack">&#8592;</button>
    </div>
    <div class="top-title">
        <h1 class="home-title">Block<span class="home-hop">hop</span></h1>
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
        margin-top: clamp(3.5rem, 2vw, 3rem);
        margin-left: 1em;
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

    .return-button {
        pointer-events: auto;
        position: absolute;
        top: 28px;
        left: 28px;
    }

    .back-button {
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

    .back-button:hover {
        transform: translateY(-2px);
        background: #86efac;
    }

    .back-button:active {
        transform: translateY(0);
    }

    .top-title {
        position: absolute;
        top: 28px;
        left: 50%;
        transform: translateX(-50%);
        pointer-events: auto;
    }

    .home-title {
        font-family: 'Pixelify Sans', monospace;
        font-size: clamp(1.5rem, 6vw, 8rem);
        line-height: 1;
        color: #fff;
        animation: title-wobble 6s ease-in-out infinite alternate;
        transform-style: preserve-3d;
        display: inline-block;
        text-shadow: 3px 3px 0 #1a4a0a, 5px 5px 0 rgba(0,0,0,0.25);
    }

    .home-hop {
        color: #4ade80;
        text-shadow: 3px 3px 0 #166534, 5px 5px 0 rgba(0,0,0,0.25);
    }

    @keyframes splash-pulse {
        from { transform: rotate(18deg) scale(1); }
        to   { transform: rotate(18deg) scale(1.08); }
    }
    @keyframes title-wobble {
        from { transform: perspective(400px) rotateY(-4deg) scale(1); }
        to   { transform: perspective(400px) rotateY(4deg)  scale(1.04); }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
</style>