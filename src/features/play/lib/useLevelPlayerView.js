import { onMounted, onUnmounted, ref } from "vue";
import { EventBus } from "@/components/levelPlayer/EventBus";
import { createAttempt } from "@/features/play/lib/attemptApi";
import { getLevelMap } from "@/shared/lib/fetchPlayLevel";

export function useLevelPlayerView(route) {
  const mapData = ref(null);
  const runStartMs = ref(Date.now());
  const runSettled = ref(false);
  const isSubmittingAttempt = ref(false);
  const attemptSubmitError = ref("");

  function getLevelIdFromRoute() {
    const paramValue = route.params.levelId;
    if (typeof paramValue === "string" && paramValue.trim()) return paramValue.trim();
    if (Array.isArray(paramValue) && paramValue[0]?.trim()) return paramValue[0].trim();

    const queryValue = route.query.levelId;
    if (typeof queryValue === "string" && queryValue.trim()) return queryValue.trim();
    if (Array.isArray(queryValue) && queryValue[0]?.trim()) return queryValue[0].trim();

    return "";
  }

  function startRun() {
    runStartMs.value = Date.now();
    runSettled.value = false;
  }

  function dismissAttemptSubmitError() {
    attemptSubmitError.value = "";
  }

  async function submitAttemptResult(completed, worldLayer = {}) {
    if (runSettled.value || isSubmittingAttempt.value) return;
    runSettled.value = true;

    const levelId = getLevelIdFromRoute();
    if (!levelId) {
      console.warn(
        "Skipping attempt submission: no levelId in route (/play/:levelId or ?levelId=...).",
      );
      return;
    }

    isSubmittingAttempt.value = true;
    attemptSubmitError.value = "";

    try {
      await createAttempt({
        completed,
        levelId,
        timeTakenMs: Date.now() - runStartMs.value,
        worldLayer,
      });
    } catch (error) {
      runSettled.value = false;
      attemptSubmitError.value =
        error instanceof Error ? error.message : "Failed to submit attempt.";
    } finally {
      isSubmittingAttempt.value = false;
    }
  }

  const onLevelCompleted = (data) => {
    console.log("Level completed!");
    submitAttemptResult(true, data?.worldLayer);
  };

  const onRunStarted = () => {
    startRun();
  };

  const onCoinCollected = (coinType) => {
    console.log("Coin collected:", coinType);
  };

  const onEnemyKilled = (enemyType) => {
    console.log("Enemy killed:", enemyType);
  };

  const onBoxDestroyed = (content) => {
    console.log("Box destroyed:", content);
    EventBus.emit("ClearConditionCompleted");
  };

  const onAttemptFailed = (reason) => {
    console.log("Attempt failed:", reason?.reason ?? "unknown");
    submitAttemptResult(false);
  };

  // Placeholder handler for LevelPlayer's current-active-scene emit.
  const onSceneReady = () => {};

  onMounted(async () => {
    startRun();
    mapData.value = await getLevelMap({ levelId: route.params.levelId });
    EventBus.on("RunStarted", onRunStarted);
    EventBus.on("CoinCollected", onCoinCollected);
    EventBus.on("EnemyKilled", onEnemyKilled);
    EventBus.on("BoxDestroyed", onBoxDestroyed);
    EventBus.on("LevelCompleted", onLevelCompleted);
    EventBus.on("AttemptFailed", onAttemptFailed);
  });

  onUnmounted(() => {
    EventBus.off("RunStarted", onRunStarted);
    EventBus.off("CoinCollected", onCoinCollected);
    EventBus.off("EnemyKilled", onEnemyKilled);
    EventBus.off("BoxDestroyed", onBoxDestroyed);
    EventBus.off("LevelCompleted", onLevelCompleted);
    EventBus.off("AttemptFailed", onAttemptFailed);
  });

  return {
    attemptSubmitError,
    dismissAttemptSubmitError,
    mapData,
    onSceneReady,
  };
}
