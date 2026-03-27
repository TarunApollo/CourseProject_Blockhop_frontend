<script setup>
import LevelListElement from "../features/components/LevelListElement.vue"
import tempLevelsList from "../stores/tempLevelsStore"
import ReturnButton from "@/shared/components/ReturnButton.vue";
import MainLogo from "@/shared/components/MainLogo.vue";
import '@/assets/viewsStyle/LevelsList.css';
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
        <div class="list-elem" v-for="element in tempLevelsList.tempLevelsList" :key="element.id">
            <LevelListElement :level="element"/>
        </div>
    </div>
</template>