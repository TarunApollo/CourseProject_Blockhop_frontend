import { getCachedCsrfToken } from "@/shared/lib/csrf";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function getAttitudeErrorMessage(status, action) {
    switch (status) {
        case 401:
            return "You need to be logged in to change a level attitude.";
        case 403:
            return "You are not allowed to change this level attitude.";
        case 404:
            return "Level not found while changing attitude.";
        default:
            return `Failed to ${action} level attitude (${status}).`;
    }
}

async function requestPublishedLevelAttitude(levelId, method, body) {
    const { headerName, token } = await getCachedCsrfToken();
    const response = await fetch(`${API_BASE_URL}/levels/${levelId}/attitude`, {
        method,
        headers: {
            ...(body ? { "Content-Type": "application/json" } : {}),
            [headerName]: token,
        },
        credentials: "include",
        body: body ? JSON.stringify(body) : undefined,
    });

    return response;
}

export async function setPublishedLevelAttitude(levelId, attitude) {
    const response = await requestPublishedLevelAttitude(levelId, "PUT", {
        attitude,
    });

    if (!response.ok) {
        throw new Error(getAttitudeErrorMessage(response.status, "update"));
    }

    return response.json();
}

export async function clearPublishedLevelAttitude(levelId) {
    const response = await requestPublishedLevelAttitude(levelId, "DELETE");

    if (!response.ok) {
        throw new Error(getAttitudeErrorMessage(response.status, "clear"));
    }

    return null;
}
