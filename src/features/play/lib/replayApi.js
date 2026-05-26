import { getCachedCsrfToken } from "@/shared/lib/csrf";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function getHeaders() {
  const { headerName, token } = await getCachedCsrfToken();
  return {
    "Content-Type": "application/json",
    [headerName]: token,
  };
}

export async function notifyLevelStarted(levelId) {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE_URL}/replay/start`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ levelId }),
  });

  if (!response.ok) {
    console.error("[anticheat] start notification failed:", response.status);
  }
}

export async function submitReplay(levelId, attemptId, totalFrames, inputLog) {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE_URL}/replay/submit`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({
      levelId,
      attemptId,
      totalFrames,
      inputLog: inputLog.map((entry) => ({
        frame: entry.frame,
        left: entry.input.left ?? false,
        right: entry.input.right ?? false,
        jump: entry.input.jump ?? false,
        run: entry.input.run ?? false,
        climbUp: entry.input.climbUp ?? false,
        climbDown: entry.input.climbDown ?? false,
        climbExit: entry.input.climbExit ?? false,
        pickupAndThrow: entry.input.pickupAndThrow ?? false,
      })),
    }),
  });

  if (!response.ok) {
    throw new Error(`Replay submission failed: ${response.status}`);
  }

  return response.json();
}
