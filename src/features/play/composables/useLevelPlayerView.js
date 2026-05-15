import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { createAttempt } from "../lib/attemptApi";
import { getLevelMap } from "@/shared/lib/fetchPlayLevel";

export function useLevelPlayerView(route, playerRef) {
    const router = useRouter();
    const mapData = ref(null);
    const attemptSubmitError = ref("");
    const isPaused = ref(false);
    const showVictoryPopup = ref(false);

    let interval = null;
    let intervalStartMs = null;
    let runSettled = false;
    let oldElapsed = 0;
    const elapsedMs = ref(0);
    let isSubmittingAttempt = false;
    let conditionType = ref("none");
    let currentAmount = ref(0);
    let requiredAmount = ref(0);

    function getLevelId() {
        const id = route.params.levelId || route.query.levelId;
        return (Array.isArray(id) ? id[0] : id)?.trim() || "";
    }

    function startInterval() {
        if (interval) return;
        interval = setInterval(() => {
            elapsedMs.value = oldElapsed + (Date.now() - intervalStartMs)
        }, 1000)
    }

    function resumeTimer() {
        if (interval) return;
        intervalStartMs = Date.now();
        elapsedMs.value = oldElapsed;
        startInterval()
    }

    function stopTimer() {
        if (!interval) return;
        elapsedMs.value = oldElapsed + (Date.now() - intervalStartMs);
        clearInterval(interval);
        oldElapsed = elapsedMs.value;
        interval = null;
    }

    function startRun() {
        if (interval) clearInterval(interval);
        interval = null;
        oldElapsed = 0;
        elapsedMs.value = 0;
        intervalStartMs = Date.now();
        startInterval()
        runSettled = false;
        currentAmount.value = 0;
        isPaused.value = false;
        showVictoryPopup.value = false;
    }


    function dismissAttemptSubmitError() {
        attemptSubmitError.value = "";
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
            stopTimer();
            await createAttempt({
                completed,
                levelId,
                timeTakenMs: elapsedMs.value,
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
        if (isPaused.value) {
            stopTimer();
            playerRef.value?.pause();
        } else {
            resumeTimer();
            playerRef.value?.resume();
        }
    };

    const handleGlobalKeydown = (e) => {
        if (e.key === "Escape") onTogglePause();
    };

    const handleContinue = () => {
        isPaused.value = false;
        resumeTimer();
        playerRef.value?.resume();
    };

    const handleTryAgain = () => {
        showVictoryPopup.value = false;
        playerRef.value?.restart();
    };

    const onRunStarted = () => {
        startRun();
    };

    const updateCondition = () => {
        currentAmount.value++;
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

            window.addEventListener("keydown", handleGlobalKeydown);
        } catch (e) {
            console.error("Failed to load level:", e);
        }
    });

    onUnmounted(() => {
        window.removeEventListener("keydown", handleGlobalKeydown);
        stopTimer();
    });

    return {
        attemptSubmitError,
        dismissAttemptSubmitError,
        mapData,
        requiredAmount,
        conditionType,
        currentAmount,
        elapsedMs,
        onSceneReady: () => { },
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
    };
}
