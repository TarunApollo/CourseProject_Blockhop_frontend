const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

let catalogPromise = null;
let catalogCache = null;

function buildIndexes(tiles) {
    const byId = new Map();

    for (const tile of tiles) {
        byId.set(tile.id, tile);
    }

    return { byId };
}

export async function fetchTileCatalog() {
    if (catalogCache) return catalogCache;
    if (catalogPromise) return catalogPromise;

    catalogPromise = fetch(`${API_BASE_URL}/assets/tile-catalog`, {
        credentials: "include",
    })
        .then(async (response) => {
            if (!response.ok) {
                throw new Error(`Failed to load tile catalog (${response.status})`);
            }
            const data = await response.json();
            const tiles = Array.isArray(data?.tiles) ? data.tiles : [];
            const indexes = buildIndexes(tiles);
            catalogCache = { tiles, ...indexes };
            return catalogCache;
        })
        .finally(() => {
            catalogPromise = null;
        });

    return catalogPromise;
}

export function getCachedTileCatalog() {
    return catalogCache;
}

