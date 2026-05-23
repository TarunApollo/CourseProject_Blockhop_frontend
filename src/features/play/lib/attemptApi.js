import { getCachedCsrfToken } from "@/shared/lib/csrf";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function getErrorMessage(status) {
  switch (status) {
    case 400:
      return "Attempt payload was invalid.";
    case 401:
      return "You need to be logged in to submit attempts.";
    case 403:
      return "Attempt submission is not allowed for this level.";
    case 404:
      return "Level not found while submitting attempt.";
    default:
      return `Attempt submission failed (${status}).`;
  }
}

function getGhostErrorMessage(status) {
  switch (status) {
    case 401:
      return "You need to be logged in to load the ghost replay.";
    case 403:
      return "Ghost replay is not available for this level.";
    default:
      return `Ghost replay fetch failed (${status}).`;
  }
}

export function toIso8601Duration(timeTakenMs) {
  const totalMs = Math.max(0, Math.floor(Number(timeTakenMs) || 0));
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1000);
  const milliseconds = totalMs % 1000;

  let duration = "PT";
  if (hours > 0) duration += `${hours}H`;
  if (minutes > 0) duration += `${minutes}M`;

  if (seconds > 0 || milliseconds > 0 || duration === "PT") {
    if (milliseconds > 0) {
      const fraction = String(milliseconds).padStart(3, "0").replace(/0+$/, "");
      duration += `${seconds}.${fraction}S`;
    } else {
      duration += `${seconds}S`;
    }
  }

  return duration;
}

/**
 * Fetches the ghost replay (fastest completed attempt with a replayable input
 * log) for the given level. The current user must already have completed the
 * level at least once for the backend to return a ghost; otherwise it returns
 * 204 No Content and this function resolves to `null`.
 *
 * Returns `null` when the endpoint has nothing to offer (204) or when the
 * level is unpublished / unknown (404). Throws on any other non-OK status so
 * the caller can surface a real error.
 *
 * @param {string} levelId the id of the level whose ghost is requested
 * @returns {Promise<{
 *   attemptId: string,
 *   inputLog: Array<{ frame: number, left: boolean, right: boolean, jump: boolean, run: boolean }>,
 *   timeTakenMs: number,
 *   holderName: string,
 * } | null>}
 */
export async function getGhostForLevel(levelId) {
  const trimmedLevelId = String(levelId ?? "").trim();
  if (!trimmedLevelId) {
    throw new Error("Cannot fetch ghost: missing level id.");
  }

  const response = await fetch(`${API_BASE_URL}/levels/${trimmedLevelId}/ghost`, {
    method: "GET",
    credentials: "include",
  });

  if (response.status === 204) return null;
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(getGhostErrorMessage(response.status));
  }

  return response.json();
}

export async function createAttempt({ completed, levelId, timeTakenMs, worldLayer = {}, playerPosition = { x: 0, y: 0 }} ) {
  const trimmedLevelId = String(levelId ?? "").trim();
  if (!trimmedLevelId) {
    throw new Error("Cannot submit attempt: missing level id.");
  }

  const { headerName, token } = await getCachedCsrfToken();
  const response = await fetch(`${API_BASE_URL}/levels/${trimmedLevelId}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [headerName]: token,
    },
    credentials: "include",
    body: JSON.stringify({
      completed: completed,
      timestamp: new Date().toISOString(),
      timeTaken: toIso8601Duration(timeTakenMs),
      worldLayer,
      playerPosition,
    }),
  });

  if (!response.ok) {
    throw new Error(getErrorMessage(response.status));
  }

  return response.json();
}
