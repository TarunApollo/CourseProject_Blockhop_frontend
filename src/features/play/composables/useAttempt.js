import { ref } from "vue";
import { createAttempt } from "../lib/attemptApi";

export function useAttempt(onSuccess) {
  const isSubmitting = ref(false);
  const submitError = ref("");
  const runStartMs = ref(Date.now());
  const runSettled = ref(false);

  function startRun() {
    runStartMs.value = Date.now();
    runSettled.value = false;
    submitError.value = "";
  }

  async function submitResult({ levelId, completed, worldLayer, playerPosition }) {
    if (runSettled.value || isSubmitting.value) return;
    runSettled.value = true;

    if (!levelId) {
      console.warn("Attempt submission failed: missing levelId.");
      return;
    }

    isSubmitting.value = true;
    submitError.value = "";

    try {
      const response = await createAttempt({
        levelId,
        completed,
        timeTakenMs: Date.now() - runStartMs.value,
        worldLayer,
        playerPosition,
      });
      if (onSuccess) onSuccess(response);
    } catch (error) {
      runSettled.value = false;
      submitError.value = error instanceof Error ? error.message : "Failed to submit attempt.";
    } finally {
      isSubmitting.value = false;
    }
  }

  return {
    isSubmitting,
    submitError,
    runSettled,
    startRun,
    submitResult,
  };
}
