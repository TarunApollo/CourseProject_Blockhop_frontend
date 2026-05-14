const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function fetchFavorites() {
    const response = await fetch(`${API_BASE_URL}/users/me/favorites`, {
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error(`Failed to load favorites (${response.status}).`)
    }

    return response.json()
}