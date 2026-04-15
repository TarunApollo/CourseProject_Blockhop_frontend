import {getCachedCsrfToken} from '@/shared/lib/csrf'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function getLevelMap({ levelId }) {
    const { headerName, token } = await getCachedCsrfToken();
    const response = await fetch(`${API_BASE_URL}/levels/${levelId}/mapjson`, {
        "method": "GET",
        headers: {
            "Content-Type": "application/json",
            [headerName]: token,
        },
        credentials: "include"
    });

    if (!response.ok) {
        throw new Error(`Request failed (${response.status}).`);
    }

    return response.json();
}