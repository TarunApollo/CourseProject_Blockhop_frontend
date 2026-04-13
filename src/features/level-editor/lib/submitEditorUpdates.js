import {getCachedCsrfToken} from '@/shared/lib/csrf'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function submitEditorRequest({ path, body, method = 'PUT' }) {
    const { headerName,token } = await getCachedCsrfToken()
    const response = await fetch(`${API_BASE_URL}/editor${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            [headerName] : token,
        },
        credentials: 'include',
        body: JSON.stringify(body),
    })

    if (!response.ok) {
        throw new Error(`Request failed (${response.status}).`)
    }

    return response.json()
}