import {getCachedCsrfToken} from '@/shared/lib/csrf'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

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

function getErrorMessage(status, messages = {}) {
  const specific = messages?.[status];
  if (typeof specific === "function") {
    return specific(status);
  }

  if (specific) {
    return specific;
  }

  if (typeof messages?.default === "function") {
    return messages.default(status);
  }

  if (messages?.default) {
    return messages.default;
  }

  return `Request failed (${status}).`;
}

export async function submitLevelRequest({ path, body, messages, method = 'POST' }) {
  const { headerName,token } = await getCachedCsrfToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      [headerName] : token,
    },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(getErrorMessage(response.status, messages))
  }

  return parseSuccessfulResponse(response);
}
