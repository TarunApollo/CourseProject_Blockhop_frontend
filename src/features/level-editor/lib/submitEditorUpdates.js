import { getCachedCsrfToken } from "@/shared/lib/csrf";

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

export async function submitEditorUpdates(levelId, worldLayer, objectLayer) {
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
    await submitEditorRequest({
      path: `/${levelId}/object-layer`,
      body: { objects: objectLayerList },
    });
    await submitEditorRequest({
      path: `/${levelId}/world-layer`,
      body: { tiles: worldLayerList },
    });
  } catch (e) {
    console.error(e.message);
  }
}

function extractPositionFromString(key) {
  const [x, y] = String(key).split(",").map(Number);
  return { x, y };
}
