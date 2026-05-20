const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

function buildParams({ sortBy, period, minClearRate, maxClearRate, minAttempts, maxAttempts, minLikes, maxLikes, minDislikes, maxDislikes, description }) {
  const params = new URLSearchParams({ sortBy, period })
  if (minClearRate !== '' && minClearRate != null) params.set('minClearRate', minClearRate / 100)
  if (maxClearRate !== '' && maxClearRate != null) params.set('maxClearRate', maxClearRate / 100)
  if (minAttempts !== '' && minAttempts != null) params.set('minAttempts', minAttempts)
  if (maxAttempts !== '' && maxAttempts != null) params.set('maxAttempts', maxAttempts)
  if (minLikes !== '' && minLikes != null) params.set('minLikes', minLikes)
  if (maxLikes !== '' && maxLikes != null) params.set('maxLikes', maxLikes)
  if (minDislikes !== '' && minDislikes != null) params.set('minDislikes', minDislikes)
  if (maxDislikes !== '' && maxDislikes != null) params.set('maxDislikes', maxDislikes)
  if (description && description.trim()) params.set('description', description.trim())
  return params
}

function allFilterArgs({ sortBy, period, minClearRate, maxClearRate, minAttempts, maxAttempts, minLikes, maxLikes, minDislikes, maxDislikes, description }) {
  return { sortBy, period, minClearRate, maxClearRate, minAttempts, maxAttempts, minLikes, maxLikes, minDislikes, maxDislikes, description }
}

export async function fetchPublishedLevels({
  sortBy = 'POPULARITY',
  period = 'ALL_TIME',
  minClearRate = '',
  maxClearRate = '',
  minAttempts = '',
  maxAttempts = '',
  minLikes = '',
  maxLikes = '',
  minDislikes = '',
  maxDislikes = '',
  description = '',
} = {}) {
  const params = buildParams(allFilterArgs({ sortBy, period, minClearRate, maxClearRate, minAttempts, maxAttempts, minLikes, maxLikes, minDislikes, maxDislikes, description }))

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
  minLikes = '',
  maxLikes = '',
  minDislikes = '',
  maxDislikes = '',
  description = '',
} = {}) {
  const params = buildParams(allFilterArgs({ sortBy, period, minClearRate, maxClearRate, minAttempts, maxAttempts, minLikes, maxLikes, minDislikes, maxDislikes, description }))

  const response = await fetch(
    `${API_BASE_URL}/levels/published/random?${params.toString()}`,
    { credentials: 'include' },
  )

  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Failed to fetch random level (${response.status}).`)
  return response.json()
}
