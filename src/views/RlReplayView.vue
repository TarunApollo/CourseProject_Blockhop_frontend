<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import RlReplayLevelPlayer from "../rl/RlReplayLevelPlayer.vue";

const mapData = ref(null);
const replayDemos = ref([]);
const loadError = ref("");
const playerRef = ref(null);
const playbackRate = ref(1);
const playbackRates = [0.5, 1, 2, 4];
const replayStatus = ref("idle");
const replayProbe = ref(null);
let replayProbeTimer = null;

const width = window.innerWidth;
const height = window.innerHeight;

onMounted(async () => {
  try {
    const [mapResponse, demo4Response] = await Promise.all([
      fetch("/assets/map1.json"),
      fetch("/assets/rl/demo4.json"),
    ]);

    if (!mapResponse.ok) {
      throw new Error(`Failed to load map1.json: ${mapResponse.status}`);
    }
    if (!demo4Response.ok) {
      throw new Error(`Failed to load demo4.json: ${demo4Response.status}`);
    }

    mapData.value = withDefaultClearConditionProperties(await mapResponse.json());
    replayDemos.value = [
      {
        label: "Demo 4",
        demo: await demo4Response.json(),
        successIndex: 0,
      },
    ];
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : "Failed to load replay map";
  }
});

onUnmounted(() => {
  stopReplayProbe();
});

function playDemo(replayDemo) {
  replayStatus.value = "running";
  startReplayProbe();
  playerRef.value?.playDemoReplay(replayDemo.demo, replayDemo.successIndex, {
    actionRepeat: replayDemo.demo.actionRepeat ?? 4,
    playbackRate: playbackRate.value,
  });
}

function handleLevelCompleted() {
  replayStatus.value = "completed";
  updateReplayProbe();
}

function handleAttemptFailed(payload) {
  replayStatus.value = `failed: ${payload?.reason ?? "unknown"}`;
  updateReplayProbe();
}

function startReplayProbe() {
  stopReplayProbe();
  replayProbeTimer = window.setInterval(updateReplayProbe, 250);
}

function stopReplayProbe() {
  if (replayProbeTimer !== null) {
    window.clearInterval(replayProbeTimer);
    replayProbeTimer = null;
  }
}

function updateReplayProbe() {
  replayProbe.value = playerRef.value?.getReplayDebugState?.() ?? null;
  if (replayProbe.value?.isComplete) {
    replayStatus.value = "completed";
    stopReplayProbe();
  } else if (replayProbe.value?.gameOver) {
    replayStatus.value = "game over";
    stopReplayProbe();
  }
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
</script>

<template>
  <div class="fixed inset-0 bg-black overflow-hidden">
    <RlReplayLevelPlayer
      ref="playerRef"
      v-if="mapData"
      :map="mapData"
      :width="width"
      :height="height"
      @level-completed="handleLevelCompleted"
      @attempt-failed="handleAttemptFailed"
    />
    <div
      v-if="mapData && replayDemos.length"
      class="absolute left-3 top-3 z-10 flex gap-2"
    >
      <button
        v-for="replayDemo in replayDemos"
        :key="replayDemo.label"
        class="rounded bg-black/70 px-3 py-2 text-xs font-mono text-white ring-1 ring-white/25 hover:bg-white/15"
        type="button"
        @click="playDemo(replayDemo)"
      >
        {{ replayDemo.label }}
      </button>
      <div class="flex gap-1 rounded bg-black/70 p-1 ring-1 ring-white/25">
        <button
          v-for="rate in playbackRates"
          :key="rate"
          class="rounded px-2 py-1 text-xs font-mono text-white hover:bg-white/15"
          :class="{ 'bg-white/25': playbackRate === rate }"
          type="button"
          @click="playbackRate = rate"
        >
          {{ rate }}x
        </button>
      </div>
      <div
        class="rounded bg-black/70 px-3 py-2 text-xs font-mono text-white ring-1 ring-white/25"
      >
        {{ replayStatus }}
        <span v-if="replayProbe?.x !== null && replayProbe?.x !== undefined">
          x={{ replayProbe.x.toFixed(0) }}
        </span>
      </div>
    </div>
    <div
      v-else-if="loadError"
      class="absolute inset-0 grid place-items-center text-white font-mono text-sm"
    >
      {{ loadError }}
    </div>
  </div>
</template>
