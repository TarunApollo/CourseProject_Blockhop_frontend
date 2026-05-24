import { ref, watch } from "vue";

const STORAGE_KEY = "ghost-preference";

export function useGhostPreference() {
  const stored = localStorage.getItem(STORAGE_KEY);
  const ghostEnabled = ref(stored === null ? true : stored !== "false");

  watch(ghostEnabled, (val) => {
    localStorage.setItem(STORAGE_KEY, String(val));
  });

  return { ghostEnabled };
}
