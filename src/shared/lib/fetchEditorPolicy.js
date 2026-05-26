import { populateEditorPolicy } from "@/features/level-editor/lib/editorTilePolicy";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

let policyPromise = null;
let policyCache = null;

export async function fetchEditorPolicy() {
    if (policyCache) return policyCache;
    if (policyPromise) return policyPromise;

    policyPromise = fetch(`${API_BASE_URL}/assets/editor-policy`, {
        credentials: "include",
    })
        .then(async (response) => {
            if (!response.ok) {
                throw new Error(`Failed to load editor policy (${response.status})`);
            }
            policyCache = await response.json();
            populateEditorPolicy(policyCache);
            return policyCache;
        })
        .finally(() => {
            policyPromise = null;
        });

    return policyPromise;
}

export function getCachedEditorPolicy() {
    return policyCache;
}
