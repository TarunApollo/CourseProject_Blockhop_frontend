import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { createAttempt, getGhostForLevel } from "../lib/attemptApi";
import { notifyLevelStarted, submitReplay } from "../lib/replayApi";
import { getLevelMap } from "@/shared/lib/fetchPlayLevel";
import { getStoredGhostPreference } from "@/shared/composables/useGhostPreference";

export function useLevelPlayerView(route, playerRef) {
    const router = useRouter();
    const mapData = ref(null);
    const ghostInputLog = ref(null);
    const initialGhostToggleAvailable = route.query.ghostEligible === "true";
    const hasGhostQueryOverride = route.query.ghost === "false" || route.query.ghost === "true";
    const initialGhostVisible = hasGhostQueryOverride
        ? route.query.ghost !== "false"
        : getStoredGhostPreference();
    const ghostVisible = ref(initialGhostVisible);
    const ghostToggleAvailable = ref(initialGhostToggleAvailable);
    const playerInstanceKey = ref(0);
    const attemptSubmitError = ref("");
    const isPaused = ref(false);
    const showVictoryPopup = ref(false);

    let interval = null;
    let intervalStartMs = null;
    let runSettled = false;
    let oldElapsed = 0;
    const elapsedMs = ref(0);
    let isSubmittingAttempt = false;
    let pendingGhostRefresh = null;
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

    async function refreshGhostInputLog({ preserveExistingOnFailure = false } = {}) {
        const levelId = getLevelId();
        if (!levelId) {
            ghostInputLog.value = null;
            return null;
        }

        try {
            const ghost = await getGhostForLevel(levelId);
            ghostInputLog.value = ghost?.inputLog ?? null;
            return ghost;
        } catch (error) {
            console.warn("Failed to load ghost replay:", error);
            if (!preserveExistingOnFailure) {
                ghostInputLog.value = null;
            }
            return null;
        }
    }

    async function submitAttemptResult(
        completed,
        worldLayer = {},
        playerPosition = { x: 0, y: 0 },
    ) {
        if (runSettled || isSubmittingAttempt) return null;
        runSettled = true;

        const levelId = getLevelId();
        if (!levelId) {
            runSettled = false;
            attemptSubmitError.value = "Cannot submit attempt: missing level id.";
            return null;
        }

        isSubmittingAttempt = true;
        attemptSubmitError.value = "";

        try {
            stopTimer();
            return await createAttempt({
                completed,
                levelId,
                timeTakenMs: elapsedMs.value,
                worldLayer,
                playerPosition,
            });
        } catch (error) {
            runSettled = false;
            attemptSubmitError.value =
                error instanceof Error ? error.message : "Failed to submit attempt.";
            return null;
        } finally {
            isSubmittingAttempt = false;
        }
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
        const attempt = await submitAttemptResult(true, data?.worldLayer, data?.playerPosition);
        if (data?.inputLog && attempt?.id) {
            pendingGhostRefresh = submitReplay(getLevelId(), attempt.id, data.totalFrames, data.inputLog)
                .then(() => refreshGhostInputLog({ preserveExistingOnFailure: true }))
                .then((ghost) => {
                    if (ghost?.inputLog) {
                        ghostToggleAvailable.value = true;
                    }
                })
                .catch((error) => {
                    console.error("[anticheat] replay submission failed:", error);
                })
                .finally(() => {
                    pendingGhostRefresh = null;
                });
        }
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

    const onRunStarted = () => {
        startRun();
        notifyLevelStarted(getLevelId()).catch((error) => {
            console.error("[anticheat] level start notification failed:", error);
        });
    };

    const handleToggleGhost = () => {
        ghostVisible.value = !ghostVisible.value;
        playerRef.value?.setGhostVisible(ghostVisible.value);
    };

    const handleTryAgain = async () => {
        if (pendingGhostRefresh) {
            await pendingGhostRefresh;
        }
        showVictoryPopup.value = false;
        playerInstanceKey.value++;
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

        // Fetch the map and the ghost replay in parallel. We populate
        // ghostInputLog BEFORE mapData so that when <LevelPlayer> mounts
        // (gated on v-if="mapData") its ghostInputLog prop is already
        // final — StartGame only runs once on mount, so a late ghost
        // update would never reach Phaser.
        //
        // The ghost is optional: a null result (204 / 404 / network
        // error) just means no ghost is shown for this run; it must not
        // block map loading.
        const [mapResult, ghostResult] = await Promise.allSettled([
            getLevelMap({ levelId }),
            refreshGhostInputLog(),
        ]);

        if (ghostResult.status === "fulfilled") {
            ghostInputLog.value = ghostResult.value?.inputLog ?? ghostInputLog.value;
        }

        if (mapResult.status === "fulfilled") {
            const data = mapResult.value;
            const props = data.properties || [];
            const typeProp = props.find((p) => p.name === "ClearConditionType");
            const amountProp = props.find((p) => p.name === "ClearConditionAmount");

            conditionType.value = String(typeProp?.value || "none").toLowerCase();
            requiredAmount.value = Number(amountProp?.value || 0);

            window.addEventListener("keydown", handleGlobalKeydown);
            // Set last so the v-if gate flips after ghostInputLog is final.
            mapData.value = data;
        } else {
            console.error("Failed to load level:", mapResult.reason);
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
        ghostInputLog,
        ghostVisible,
        ghostToggleAvailable,
        handleToggleGhost,
        playerInstanceKey,
        requiredAmount,
        conditionType,
        currentAmount,
        elapsedMs,
        onSceneReady: () => { },
        handleGoBack,
        onTogglePause,
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
