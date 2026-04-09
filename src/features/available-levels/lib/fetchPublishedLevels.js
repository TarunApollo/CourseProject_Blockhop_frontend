const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function fetchPublishedLevels({
  sortBy = 'POPULARITY',
  period = 'ALL_TIME',
} = {}) {
  const params = new URLSearchParams({
    sortBy,
    period,
  })

  const response = await fetch(
    `${API_BASE_URL}/levels/published?${params.toString()}`,
    {
      credentials: 'include',
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to load levels (${response.status}).`)
  }

  const levels = await response.json()

  return levels.map((level) => ({
    ...level,
    thumbnailUrl: new URL(level.thumbnailUrl, API_BASE_URL).toString(),
  }))

}
