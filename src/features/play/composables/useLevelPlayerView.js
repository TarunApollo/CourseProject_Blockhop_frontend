import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { EventBus } from "@/components/levelPlayer/EventBus";
import { createAttempt } from "../lib/attemptApi";
import { getLevelMap } from "@/shared/lib/fetchPlayLevel";

export function useLevelPlayerView(route) {
  const router = useRouter();
  const mapData = ref(null);
  const attemptSubmitError = ref("");
  const isPaused = ref(false);
  const showVictoryPopup = ref(false);

  const runStartMs = ref(Date.now());
  let runSettled = false;
  let isSubmittingAttempt = false;
  let conditionType = ref("none");
  let currentAmount = ref(0);
  let requiredAmount = ref(0);

  function getLevelId() {
    const id = route.params.levelId || route.query.levelId;
    return (Array.isArray(id) ? id[0] : id)?.trim() || "";
  }

  function startRun() {
    runStartMs.value = Date.now();
    runSettled = false;
    currentAmount.value = 0;
    isPaused.value = false;
    showVictoryPopup.value = false;
  }

  function dismissAttemptSubmitError() {
    attemptSubmitError.value = "";
  }

  function checkClearCondition() {
    if (currentAmount.value >= requiredAmount.value) {
      EventBus.emit("ClearConditionCompleted");
    }
  }

  async function submitAttemptResult(
    completed,
    worldLayer = {},
    playerPosition = { x: 0, y: 0 },
  ) {
    if (runSettled || isSubmittingAttempt) return false;
    runSettled = true;

    const levelId = getLevelId();
    if (!levelId) {
      runSettled = false;
      attemptSubmitError.value = "Cannot submit attempt: missing level id.";
      return false;
    }

    isSubmittingAttempt = true;
    attemptSubmitError.value = "";

    try {
      await createAttempt({
        completed,
        levelId,
        timeTakenMs: Date.now() - runStartMs.value,
        worldLayer,
        playerPosition,
      });
      return true;
    } catch (error) {
      runSettled = false;
      attemptSubmitError.value =
        error instanceof Error ? error.message : "Failed to submit attempt.";
      return false;
    } finally {
      isSubmittingAttempt = false;
    }
  }

  function handleGoBack() {
    const from = route.query.from;
    if (from === "profile") {
      router.push("/profile");
    } else if (from === "level-list") {
      router.push("/level-list");
    } else {
      router.push("/home");
    }
  }

  const onLevelCompleted = async (data) => {
    showVictoryPopup.value = true;
    await submitAttemptResult(true, data?.worldLayer, data?.playerPosition);
  };

  const onAttemptFailed = () => submitAttemptResult(false);

  const onTogglePause = () => {
    if (showVictoryPopup.value || runSettled) return;
    isPaused.value = !isPaused.value;
    EventBus.emit(isPaused.value ? "PauseGame" : "ResumeGame");
  };

  const handleGlobalKeydown = (e) => {
    if (e.key === "Escape") onTogglePause();
  };

  const handleContinue = () => {
    isPaused.value = false;
    EventBus.emit("ResumeGame");
  };

  const handleTryAgain = () => {
    showVictoryPopup.value = false;
    EventBus.emit("RestartGame");
  };

  const onRunStarted = () => {
    startRun();
    if (conditionType.value === "none" || requiredAmount.value === 0) {
      EventBus.emit("ClearConditionCompleted");
    }
  };

  const updateCondition = () => {
    currentAmount.value++;
    checkClearCondition();
  };

  const onCoinCollected = () => {
    if (conditionType.value.includes("coin")) updateCondition();
  };

  const onEnemyKilled = (enemyType) => {
    const type = conditionType.value.toLowerCase();
    if (enemyType?.toLowerCase().includes(type)) updateCondition();
  };

  const onBoxDestroyed = () => {
    if (conditionType.value.includes("box")) updateCondition();
  };

  onMounted(async () => {
    const levelId = getLevelId();
    if (!levelId) return;

    try {
      const data = await getLevelMap({ levelId });
      mapData.value = data;

      const props = data.properties || [];
      const typeProp = props.find((p) => p.name === "ClearConditionType");
      const amountProp = props.find((p) => p.name === "ClearConditionAmount");

      conditionType.value = String(typeProp?.value || "none").toLowerCase();
      requiredAmount.value = Number(amountProp?.value || 0);

      EventBus.on("RunStarted", onRunStarted);
      EventBus.on("CoinCollected", onCoinCollected);
      EventBus.on("EnemyKilled", onEnemyKilled);
      EventBus.on("BoxDestroyed", onBoxDestroyed);
      EventBus.on("LevelCompleted", onLevelCompleted);
      EventBus.on("AttemptFailed", onAttemptFailed);
      EventBus.on("TogglePause", onTogglePause);
      window.addEventListener("keydown", handleGlobalKeydown);
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
    EventBus.off("TogglePause", onTogglePause);
    window.removeEventListener("keydown", handleGlobalKeydown);
  });

  return {
    attemptSubmitError,
    dismissAttemptSubmitError,
    mapData,
    requiredAmount,
    conditionType,
    currentAmount,
    runStartMs,
    onSceneReady: () => {},
    handleGoBack,
    isPaused,
    showVictoryPopup,
    handleContinue,
    handleTryAgain,
  };
}
