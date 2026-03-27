const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

function getErrorMessage(status, messages) {
  if (messages[status]) {
    return messages[status]
  }

  if (messages.default) {
    return messages.default(status)
  }

  return `Request failed (${status}).`
}

export async function submitLevelRequest({ path, body, messages, method = 'POST' }) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(getErrorMessage(response.status, messages))
  }

  return response.json()
}
