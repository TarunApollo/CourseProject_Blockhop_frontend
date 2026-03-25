<script setup>
import { onMounted, onUnmounted } from 'vue';
import LevelPlayer from '../components/LevelPlayer.vue';
import { EventBus } from '../components/levelPlayer/EventBus';
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
    <div class="return-button">
      <button class="back-button" type="button" @click="goBack">&#8592;</button>
    </div>
    <div class="top-title">
        <h1 class="home-title">Block<span class="home-hop">hop</span></h1>
    </div>

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

.top-title {
  position: absolute;
  top: 28px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: auto;
}

.return-button {
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

.return-button{
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
</style>
