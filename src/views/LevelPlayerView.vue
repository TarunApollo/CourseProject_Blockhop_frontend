<script setup>
import { useRoute } from "vue-router";
import LevelPlayer from "../components/LevelPlayer.vue";
import LevelPlayerTopbar from "@/features/play/components/LevelPlayerTopbar.vue";
import LevelPlayerUI from "@/features/play/components/LevelPlayerUI.vue";
import { useLevelPlayerView } from "@/features/play/lib/useLevelPlayerView";

const route = useRoute();
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
  mapData,
} = useLevelPlayerView(route);

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
          v-if="mapData"
          @current-active-scene="onSceneReady"
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
