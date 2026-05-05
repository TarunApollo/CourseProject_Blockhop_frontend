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

export async function createAttempt({ completed, levelId, timeTakenMs, worldLayer = {}, playerPosition = { x: 0, y: 0 }, inputLog = [] } ) {
  const trimmedLevelId = String(levelId ?? "").trim();
  if (!trimmedLevelId) {
    throw new Error("Cannot submit attempt: missing level id.");
  }

  console.log(`INPUT_LOG: ${JSON.stringify(inputLog)}`);

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
      inputLog,
    }),
  });

  if (!response.ok) {
    throw new Error(getErrorMessage(response.status));
  }

  // Backend returns plain text "Successful level submission."
  return response.text();
}
