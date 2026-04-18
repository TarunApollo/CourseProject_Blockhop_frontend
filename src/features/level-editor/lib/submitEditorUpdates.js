import { getCachedCsrfToken } from "@/shared/lib/csrf";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function parseSuccessfulResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

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
    throw new Error(`Request failed (${response.status}) for ${path}.`);
  }

  return parseSuccessfulResponse(response);
}

export async function submitEditorUpdates(levelId, worldLayer, objectLayer) {
  if (!levelId) {
    throw new Error("Cannot save level: missing level id.");
  }

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
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Failed to save object layer. ${error.message}`
        : "Failed to save object layer."
    );
  }

  try {
    await submitEditorRequest({
      path: `/${levelId}/world-layer`,
      body: { tiles: worldLayerList },
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Failed to save world layer. ${error.message}`
        : "Failed to save world layer."
    );
  }
}

function extractPositionFromString(key) {
  const [x, y] = String(key).split(",").map(Number);
  return { x, y };
}
