<script setup>
import { onMounted, onUnmounted } from 'vue';
import LevelPlayer from '../components/LevelPlayer.vue';
import { EventBus } from '../components/levelPlayer/EventBus';
import ReturnButton from '@/shared/components/ReturnButton.vue';
import MainLogo from '@/shared/components/MainLogo.vue';

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
    <ReturnButton/>
    <MainLogo/>

    <div class="centered">
        <LevelPlayer @current-active-scene="onSceneReady"
            :width="1020" :height="700" map="assets/map1.json" />
    </div>
</template>

<style scoped>
.centered {
    display: flex;
    justify-content: center;
    margin-top: 4vh;
    z-index: -1;
}
</style>