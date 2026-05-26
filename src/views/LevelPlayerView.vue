<script setup>
import { ref } from "vue";
import { useRoute } from "vue-router";
import LevelPlayer from "../components/LevelPlayer.vue";
import LevelPlayerTopbar from "@/features/play/components/LevelPlayerTopbar.vue";
import LevelPlayerUI from "@/features/play/components/LevelPlayerUI.vue";
import { useLevelPlayerView } from "@/features/play/lib/useLevelPlayerView";
import { DEFAULT_PLAYER_SKIN } from "@/components/levelPlayer/phaser/phaserConstants";

const route = useRoute();
const playerRef = ref(null);
const playerSkin = ref(DEFAULT_PLAYER_SKIN);
const {
  attemptSubmitError,
  requiredAmount,
  currentAmount,
  conditionType,
  elapsedMs,
  onSceneReady,
  handleGoBack,
  isPaused,
  showVictoryPopup,
  handleContinue,
  handleTryAgain,
  onRunStarted,
  onCoinCollected,
  onEnemyKilled,
  onBoxDestroyed,
  onLevelCompleted,
  onAttemptFailed,
  mapData,
} = useLevelPlayerView(route, playerRef);

</script>

<template>
  <div class="fixed inset-0 bg-black overflow-hidden font-body text-white flex flex-col">
    <LevelPlayerTopbar
      :mapData="mapData"
      :conditionType="conditionType"
      :currentAmount="currentAmount"
      :requiredAmount="requiredAmount"
      :elapsedMs="elapsedMs"
    />

    <div class="relative flex-1">
      <div class="absolute inset-0">
        <LevelPlayer
          ref="playerRef"
          :key="playerSkin"
          v-if="mapData"
          @current-active-scene="onSceneReady"
          @run-started="onRunStarted"
          @coin-collected="onCoinCollected"
          @enemy-killed="onEnemyKilled"
          @box-destroyed="onBoxDestroyed"
          @level-completed="onLevelCompleted"
          @attempt-failed="onAttemptFailed"
          :map="mapData"
          :playerSkin="playerSkin"
        />
      </div>
    </div>

    <LevelPlayerUI
      :isPaused="isPaused"
      :showVictoryPopup="showVictoryPopup"
      :attemptSubmitError="attemptSubmitError"
      v-model:playerSkin="playerSkin"
      @continue="handleContinue"
      @quit="handleGoBack"
      @restart="handleTryAgain"
      @exit="handleGoBack"
    />
  </div>
</template>
