<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import RlReplayLevelPlayer from "../rl/RlReplayLevelPlayer.vue";
import BackButton from "@/shared/components/BackButton.vue";

const mapData = ref(null);
const replayDemos = ref([]);
const failureCases = ref([]);
const loadError = ref("");
const playerRef = ref(null);
const FAILURE_SLOW_MOTION_WINDOW = {
  minX: 6500,
  maxX: 7600,
  playbackRate: 0.35,
};
const failureQueueActive = ref(false);
const currentFailureIndex = ref(-1);
let nextReplayTimer = null;

const width = window.innerWidth;
const height = window.innerHeight;

onMounted(async () => {
  try {
    const [mapResponse, successCaseResponse, failureCasesResponse] = await Promise.all([
      fetch("/assets/map1.json"),
      fetch("/assets/rl/successCase.jsonl"),
      fetch("/assets/rl/failureCases.jsonl"),
    ]);

    if (!mapResponse.ok) {
      throw new Error(`Failed to load map1.json: ${mapResponse.status}`);
    }
    if (!successCaseResponse.ok) {
      throw new Error(`Failed to load successCase.jsonl: ${successCaseResponse.status}`);
    }
    if (!failureCasesResponse.ok) {
      throw new Error(
        `Failed to load failureCases.jsonl: ${failureCasesResponse.status}`,
      );
    }

    mapData.value = withDefaultClearConditionProperties(await mapResponse.json());
    failureCases.value = parseFailureCasesJsonl(await failureCasesResponse.text());
    replayDemos.value = [
      {
        label: "GRADUATE",
        demo: parseActionSequenceJsonl(await successCaseResponse.text()),
        successIndex: 0,
      },
    ];
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : "Failed to load replay map";
  }
});

onUnmounted(() => {
  stopFailureQueue();
});

function playDemo(replayDemo) {
  stopFailureQueue();
  playerRef.value?.playDemoReplay(replayDemo.demo, replayDemo.successIndex, {
    actionRepeat: 1,
    playbackRate: 1,
  });
}

function playFailureCases() {
  if (!failureCases.value.length) return;
  stopFailureQueue();
  failureQueueActive.value = true;
  playFailureCase(0);
}

function playFailureCase(index) {
  const sequence = failureCases.value[index];
  if (!sequence) {
    finishFailureQueue();
    return;
  }

  currentFailureIndex.value = index;
  playerRef.value?.playDemoReplay(sequence, 0, {
    actionRepeat: 1,
    playbackRate: 1,
    slowMotionWindow: FAILURE_SLOW_MOTION_WINDOW,
    skipRepeatedLocalMotion: false,
  });
}

function handleReplayEnded() {
  if (!failureQueueActive.value) return;

  const nextIndex = currentFailureIndex.value + 1;
  if (nextIndex >= failureCases.value.length) {
    finishFailureQueue();
    return;
  }

  nextReplayTimer = window.setTimeout(() => {
    playFailureCase(nextIndex);
  }, 0);
}

function stopFailureQueue() {
  failureQueueActive.value = false;
  currentFailureIndex.value = -1;
  if (nextReplayTimer !== null) {
    window.clearTimeout(nextReplayTimer);
    nextReplayTimer = null;
  }
}

function finishFailureQueue() {
  stopFailureQueue();
}

function withDefaultClearConditionProperties(mapJson) {
  const properties = [...(mapJson.properties ?? [])];
  if (!properties.some((property) => property.name === "ClearConditionType")) {
    properties.push({
      name: "ClearConditionType",
      type: "string",
      value: "none",
    });
  }
  if (!properties.some((property) => property.name === "ClearConditionAmount")) {
    properties.push({
      name: "ClearConditionAmount",
      type: "string",
      value: "0",
    });
  }
  return { ...mapJson, properties };
}

function parseActionSequenceJsonl(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function parseFailureCasesJsonl(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter(Array.isArray);
}
</script>

<template>
  <div class="fixed inset-0 bg-black overflow-hidden font-body">
    <RlReplayLevelPlayer
      ref="playerRef"
      v-if="mapData"
      :map="mapData"
      :width="width"
      :height="height"
      @replay-ended="handleReplayEnded"
    />
    <div
      v-if="mapData && replayDemos.length"
      class="absolute left-3 top-3 z-10 flex items-center gap-2"
    >
      <BackButton to="/home" />
      <button
        v-for="replayDemo in replayDemos"
        :key="replayDemo.label"
        class="rounded bg-black/70 px-3 py-2 text-xs font-bold text-white ring-1 ring-white/25 hover:bg-white/15"
        type="button"
        @click="playDemo(replayDemo)"
      >
        {{ replayDemo.label }}
      </button>
      <button
        v-if="failureCases.length"
        class="rounded bg-black/70 px-3 py-2 text-xs font-bold text-white ring-1 ring-white/25 hover:bg-white/15"
        type="button"
        @click="playFailureCases"
      >
        GO TO SCHOOL
      </button>
    </div>
    <div
      v-else-if="loadError"
      class="absolute inset-0 grid place-items-center text-white text-sm font-bold"
    >
      {{ loadError }}
    </div>
  </div>
</template>
