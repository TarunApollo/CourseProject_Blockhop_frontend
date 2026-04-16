<script setup>
import { useRoute } from "vue-router";
import LevelPlayer from "../components/LevelPlayer.vue";
import AppPopup from "@/shared/components/AppPopup.vue";
import { useLevelPlayerView } from "@/features/play/lib/useLevelPlayerView";

const route = useRoute();
const { attemptSubmitError, dismissAttemptSubmitError, mapData, onSceneReady } =
  useLevelPlayerView(route);

</script>

<template>
    <div class="centered">
        <LevelPlayer
            v-if="mapData"
            @current-active-scene="onSceneReady"
            :width="1536"
            :height="768"
            :map="mapData"
        />
    </div>
    <AppPopup
        v-if="attemptSubmitError"
        :message="attemptSubmitError"
        @close="dismissAttemptSubmitError"
    />
</template>

<style scoped>
.centered {
  display: flex;
  justify-content: center;
}
</style>
