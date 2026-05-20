import { getCachedCsrfToken } from "@/shared/lib/csrf";
import { submitLevelRequest } from "@/features/level-creation/lib/submitLevelRequest";
import { buildClearConditionPayload } from "@/features/profile/lib/clearConditionContract";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function submitEditorRequest({ path, body, method = "PUT" }) {
  const { headerName, token } = await getCachedCsrfToken();
  const response = await fetch(`${API_BASE_URL}/editor${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      [headerName]: token,
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}).`);
  }

  return response.json();
}

export async function submitEditorUpdates(
  levelId,
  worldLayer,
  objectLayer,
  levelProperties,
) {
  const objectLayerList = [];

  objectLayer.forEach((value, key) => {
    if (value.gid === 106 || value.gid === 107) return;

    const payload = {
      position: extractPositionFromString(key),
      gid: value.gid,
    };

    if (value.content) {
      payload.content = { type: "some", coinType: value.content };
    } else {
      payload.content = { type: "none" };
    }

    objectLayerList.push(payload);
  });

  const worldLayerList = [];
  worldLayer.forEach((value, key) => {
    worldLayerList.push({
      position: extractPositionFromString(key),
      gid: value.gid,
    });
  });

  try {
    await submitLevelRequest({
      path: `/levels/${levelId}/properties`,
      method: "PUT",
      body: {
        title: levelProperties.title,
        description: levelProperties.description,
        clearCondition: buildClearConditionPayload(
          levelProperties.clearConditionType,
          levelProperties.clearConditionTargetAmount,
        ),
      },
      messages: {
        401: "You need to log in to edit a level.",
        403: "You can only edit your own unpublished levels.",
        404: "Level not found.",
        default: (status) => `Failed to save changes (${status}).`,
      },
    });
    await submitEditorRequest({
      path: `/${levelId}/object-layer`,
      body: { objects: objectLayerList },
    });
    await submitEditorRequest({
      path: `/${levelId}/world-layer`,
      body: { tiles: worldLayerList },
    });
    return true;
  } catch (e) {
    console.error(e.message);
    return false;
  }
}

function extractPositionFromString(key) {
  const [x, y] = String(key).split(",").map(Number);
  return { x, y };
}
