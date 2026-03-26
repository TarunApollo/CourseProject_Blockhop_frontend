<script setup>
import { onMounted, onUnmounted } from 'vue';
import LevelPlayer from '../components/LevelPlayer.vue';
import { EventBus } from '../components/levelPlayer/EventBus';
import GameBackground from "../components/GameBackground.vue"
import ReturnButton from '@/components/ReturnButton.vue';
import MainLogo from '@/components/MainLogo.vue';

const onSceneReady = (scene) => {
    console.log('Scene ready:', scene.scene.key);
};

const onCoinCollected = (coinType) => {
    console.log('Coin collected:', coinType);
};

const onEnemyKilled = (enemyType) => {
    console.log('Enemy killed:', enemyType);
};

const onBoxDestroyed = (content) => {
    console.log('Box destroyed:', content);
    EventBus.emit('ClearConditionCompleted');
};

const onLevelCompleted = () => {
    console.log('Level completed!');
};

onMounted(() => {
    EventBus.on('CoinCollected', onCoinCollected);
    EventBus.on('EnemyKilled', onEnemyKilled);
    EventBus.on('BoxDestroyed', onBoxDestroyed);
    EventBus.on('LevelCompleted', onLevelCompleted);
});

onUnmounted(() => {
    EventBus.off('CoinCollected', onCoinCollected);
    EventBus.off('EnemyKilled', onEnemyKilled);
    EventBus.off('BoxDestroyed', onBoxDestroyed);
    EventBus.off('LevelCompleted', onLevelCompleted);
});

</script>

<template>
    <!-- <GameBackground z-index="-1000"/> -->
    <ReturnButton/>
    <MainLogo/>

    <div class="centered">
        <LevelPlayer @current-active-scene="onSceneReady"
            :width="1150" :height="740" map="assets/map1.json" />
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@700&display=swap');

.centered {
    display: flex;
    justify-content: center;
}

</style>
