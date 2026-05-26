import { ref, watch } from "vue";

const STORAGE_KEY = "ghost-preference";

export function getStoredGhostPreference() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored !== "false";
}

export function useGhostPreference() {
  const ghostEnabled = ref(getStoredGhostPreference());

  watch(ghostEnabled, (val) => {
    localStorage.setItem(STORAGE_KEY, String(val));
  });

  return { ghostEnabled };
}
