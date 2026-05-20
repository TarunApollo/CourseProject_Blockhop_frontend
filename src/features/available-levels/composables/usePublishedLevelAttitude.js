import { computed, ref } from "vue";
import {
    clearLevelAttitude,
    setLevelAttitude,
} from "@/features/available-levels/lib/publishedLevelAttitude.js";

function normalizeAttitude(attitude) {
    if (attitude === "LIKE" || attitude === "DISLIKE") return attitude;
    if (attitude === "like") return "LIKE";
    if (attitude === "dislike") return "DISLIKE";
    return null;
}

function calculateCountDeltas(from, to) {
    let likeDelta = 0;
    let dislikeDelta = 0;

    if (from === "LIKE") likeDelta -= 1;
    if (from === "DISLIKE") dislikeDelta -= 1;
    if (to === "LIKE") likeDelta += 1;
    if (to === "DISLIKE") dislikeDelta += 1;

    return { likeDelta, dislikeDelta };
}

export function usePublishedLevelAttitude(props) {
  const attitude = ref(normalizeAttitude(props.attitude));
  const likeCount = ref(props.likeCount);
  const dislikeCount = ref(props.dislikeCount);
    const isSaving = ref(false);
    const errorMessage = ref("");

    const levelId = computed(() => String(props.levelId ?? "").trim());

    async function toggleAttitude(nextAttitude) {
        if (isSaving.value || !levelId.value) return;

        isSaving.value = true;
        errorMessage.value = "";

        const previousAttitude = attitude.value;
        const nextValue = previousAttitude === nextAttitude ? null : nextAttitude;
        const { likeDelta, dislikeDelta } = calculateCountDeltas(
            previousAttitude,
            nextValue,
        );

        attitude.value = nextValue;
        likeCount.value += likeDelta;
        dislikeCount.value += dislikeDelta;

        try {
            if (nextValue === null) {
                await clearLevelAttitude(levelId.value);
            } else {
                await setLevelAttitude(levelId.value, nextValue);
            }
        } catch (error) {
            attitude.value = previousAttitude;
            likeCount.value -= likeDelta;
            dislikeCount.value -= dislikeDelta;
            errorMessage.value =
                error instanceof Error
                    ? error.message
                    : "Failed to update level attitude.";
        } finally {
            isSaving.value = false;
        }
    }

    return {
        attitude,
        likeCount,
        dislikeCount,
        isSaving,
        errorMessage,
        toggleAttitude,
    };
}
