const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

function buildParams({ sortBy, period, minClearRate, maxClearRate, minAttempts, maxAttempts, description }) {
  const params = new URLSearchParams({ sortBy, period })
  if (minClearRate !== '' && minClearRate != null) params.set('minClearRate', minClearRate / 100)
  if (maxClearRate !== '' && maxClearRate != null) params.set('maxClearRate', maxClearRate / 100)
  if (minAttempts !== '' && minAttempts != null) params.set('minAttempts', minAttempts)
  if (maxAttempts !== '' && maxAttempts != null) params.set('maxAttempts', maxAttempts)
  if (description && description.trim()) params.set('description', description.trim())
  return params
}

export async function fetchPublishedLevels({
  sortBy = 'POPULARITY',
  period = 'ALL_TIME',
  minClearRate = '',
  maxClearRate = '',
  minAttempts = '',
  maxAttempts = '',
  description = '',
} = {}) {
  const params = buildParams({ sortBy, period, minClearRate, maxClearRate, minAttempts, maxAttempts, description })

  const response = await fetch(
    `${API_BASE_URL}/levels/published?${params.toString()}`,
    { credentials: 'include' },
  )

  if (!response.ok) {
    throw new Error(`Failed to load levels (${response.status}).`)
  }

  return response.json()
}

export async function fetchRandomPublishedLevel({
  sortBy = 'POPULARITY',
  period = 'ALL_TIME',
  minClearRate = '',
  maxClearRate = '',
  minAttempts = '',
  maxAttempts = '',
  description = '',
} = {}) {
  const params = buildParams({ sortBy, period, minClearRate, maxClearRate, minAttempts, maxAttempts, description })

  const response = await fetch(
    `${API_BASE_URL}/levels/published/random?${params.toString()}`,
    { credentials: 'include' },
  )

  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Failed to fetch random level (${response.status}).`)
  return response.json()
}
