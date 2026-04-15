const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function fetchLevelToEdit(levelId) {
  const response = await fetch(`${API_BASE_URL}/users/profile`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to load profile.`);
  }

  const data = await response.json();
  const level = data.createdLevels.find((l) => l.id === levelId);

  if (!level) {
    throw new Error("Level not found or not owned by user.");
  }

  return level;
}
