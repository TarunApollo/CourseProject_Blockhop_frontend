<script setup>
import { ref } from "vue";
import { useRoute } from "vue-router";
import LevelPlayer from "../components/LevelPlayer.vue";
import LevelPlayerTopbar from "@/features/play/components/LevelPlayerTopbar.vue";
import LevelPlayerUI from "@/features/play/components/LevelPlayerUI.vue";
import { useLevelPlayerView } from "@/features/play/lib/useLevelPlayerView";

const route = useRoute();
const playerRef = ref(null);
const {
  attemptSubmitError,
  requiredAmount,
  currentAmount,
  conditionType,
  runStartMs,
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

const initialWidth = window.innerWidth;
const initialHeight = window.innerHeight - 72;
</script>

<template>
  <div class="fixed inset-0 bg-black overflow-hidden font-body text-white flex flex-col">
    <LevelPlayerTopbar
      :mapData="mapData"
      :conditionType="conditionType"
      :currentAmount="currentAmount"
      :requiredAmount="requiredAmount"
      :startTime="runStartMs"
    />

    <div class="relative flex-1">
      <div class="absolute inset-0">
        <LevelPlayer
          ref="playerRef"
          v-if="mapData"
          @current-active-scene="onSceneReady"
          @run-started="onRunStarted"
          @coin-collected="onCoinCollected"
          @enemy-killed="onEnemyKilled"
          @box-destroyed="onBoxDestroyed"
          @level-completed="onLevelCompleted"
          @attempt-failed="onAttemptFailed"
          :map="mapData"
          :width="initialWidth"
          :height="initialHeight"
        />
      </div>
    </div>

    <LevelPlayerUI
      :isPaused="isPaused"
      :showVictoryPopup="showVictoryPopup"
      :attemptSubmitError="attemptSubmitError"
      @continue="handleContinue"
      @quit="handleGoBack"
      @restart="handleTryAgain"
      @exit="handleGoBack"
    />
  </div>
</template>
