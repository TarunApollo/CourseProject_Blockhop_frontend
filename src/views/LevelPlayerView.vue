<script setup>
import {onMounted, onUnmounted, ref} from 'vue';
import LevelPlayer from '../components/LevelPlayer.vue';
import {EventBus} from '../components/levelPlayer/EventBus';
import {useRoute} from "vue-router";
import {getLevelMap} from "@/shared/lib/fetchPlayLevel.js";

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

const route = useRoute();

const mapPath = ref(null);

onMounted(async () => {
  EventBus.on('CoinCollected', onCoinCollected);
  EventBus.on('EnemyKilled', onEnemyKilled);
  EventBus.on('BoxDestroyed', onBoxDestroyed);
  EventBus.on('LevelCompleted', onLevelCompleted);

  try {
    const mapData = JSON.stringify(await getLevelMap({"levelId": route.params.levelId}));
    const blob = new Blob([mapData], {type: 'application/json'});
    mapPath.value = URL.createObjectURL(blob);
  } catch (error) {
    console.error("Failed to load map:", error);
  }

});

onUnmounted(() => {
  EventBus.off('CoinCollected', onCoinCollected);
  EventBus.off('EnemyKilled', onEnemyKilled);
  EventBus.off('BoxDestroyed', onBoxDestroyed);
  EventBus.off('LevelCompleted', onLevelCompleted);
});

</script>

<template>
  <div class="centered">
    <LevelPlayer v-if="mapPath" @current-active-scene="onSceneReady"
                 :width="1536" :height="768" :map="mapPath"/>
  </div>
</template>

<style scoped>
.centered {
  display: flex;
  justify-content: center;
}
</style>
