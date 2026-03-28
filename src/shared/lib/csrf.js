const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

let cachedCsrf

export async function getCachedCsrfToken() {
  if (cachedCsrf !== undefined) {
    return cachedCsrf
  }

  cachedCsrf = await getCsrfToken()
  return cachedCsrf
}



async function getCsrfToken() {
  const response = await fetch(`${API_BASE_URL}/csrf`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Failed to get CSRF token (${response.status}).`)
  }

  return response.json()
}
