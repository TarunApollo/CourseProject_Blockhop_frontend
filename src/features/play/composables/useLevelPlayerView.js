import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { EventBus } from "@/components/levelPlayer/EventBus";
import { createAttempt } from "../lib/attemptApi";
import { getLevelMap } from "@/shared/lib/fetchPlayLevel";

export function useLevelPlayerView(route) {
  const router = useRouter();
  const mapData = ref(null);
  const attemptSubmitError = ref("");

  let runStartMs = Date.now();
  let runSettled = false;
  let isSubmittingAttempt = false;
  let conditionType = "none";
  let currentAmount = 0;
  let requiredAmount = 0;

  function getLevelId() {
    const id = route.params.levelId || route.query.levelId;
    return (Array.isArray(id) ? id[0] : id)?.trim() || "";
  }

  function startRun() {
    runStartMs = Date.now();
    runSettled = false;
    currentAmount = 0;
  }

  function dismissAttemptSubmitError() {
    attemptSubmitError.value = "";
  }

  function checkClearCondition() {
    if (currentAmount >= requiredAmount) {
      EventBus.emit("ClearConditionCompleted");
    }
  }

  async function submitAttemptResult(completed, worldLayer = {}, playerPosition = { x: 0, y: 0 }) {
    if (runSettled || isSubmittingAttempt) return;
    runSettled = true;

    const levelId = getLevelId();
    if (!levelId) return;

    isSubmittingAttempt = true;
    attemptSubmitError.value = "";

    try {
      await createAttempt({
        completed,
        levelId,
        timeTakenMs: Date.now() - runStartMs,
        worldLayer,
        playerPosition,
      });
    } catch (error) {
      runSettled = false;
      attemptSubmitError.value = error instanceof Error ? error.message : "Failed to submit attempt.";
    } finally {
      isSubmittingAttempt = false;
    }
  }

function handleGoBack() {
    const from  = route.query.from;
     if (from === "profile") {
         router.push("/profile");
       } else if (from === "levels") {
         router.push("/levels");
       } else {
         router.push("/home"); // Fallback
      }
}

  const onLevelCompleted = async (data) => {
    await submitAttemptResult(true, data?.worldLayer, data?.playerPosition);
    handleGoBack();
  };

  const onRunStarted = () => {
    startRun();
    if (conditionType === "none" || requiredAmount === 0) {
      EventBus.emit("ClearConditionCompleted");
    }
  };

  const onCoinCollected = () => {
    if (conditionType.includes("coin")) {
      currentAmount++;
      checkClearCondition();
    }
  };

  const onEnemyKilled = (enemyType) => {
    const type = conditionType.toLowerCase();
    if (enemyType && enemyType.toLowerCase().includes(type)) {
      currentAmount++;
      checkClearCondition();
    }
  };

  const onBoxDestroyed = () => {
    if (conditionType.includes("box")) {
      currentAmount++;
      checkClearCondition();
    }
  };

  const onAttemptFailed = async () => {
    await submitAttemptResult(false);
    handleGoBack();
  };

  const onSceneReady = () => {};

  onMounted(async () => {
    const levelId = getLevelId();
    if (!levelId) return;

    try {
      const data = await getLevelMap({ levelId });
      mapData.value = data;

      const props = data.properties || [];
      const typeProp = props.find((p) => p.name === "ClearConditionType");
      const amountProp = props.find((p) => p.name === "ClearConditionAmount");

      conditionType = String(typeProp?.value || "none").toLowerCase();
      requiredAmount = Number(amountProp?.value || 0);

      EventBus.on("RunStarted", onRunStarted);
      EventBus.on("CoinCollected", onCoinCollected);
      EventBus.on("EnemyKilled", onEnemyKilled);
      EventBus.on("BoxDestroyed", onBoxDestroyed);
      EventBus.on("LevelCompleted", onLevelCompleted);
      EventBus.on("AttemptFailed", onAttemptFailed);
    } catch (e) {
      console.error("Failed to load level:", e);
    }
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
