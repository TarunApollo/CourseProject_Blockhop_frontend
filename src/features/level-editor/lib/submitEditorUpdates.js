import {getCachedCsrfToken} from '@/shared/lib/csrf'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function submitEditorRequest({ path, body, method = 'PUT' }) {
    const { headerName,token } = await getCachedCsrfToken()
    const response = await fetch(`${API_BASE_URL}/editor${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            [headerName] : token,
        },
        credentials: 'include',
        body: JSON.stringify(body),
    })

    if (!response.ok) {
        throw new Error(`Request failed (${response.status}).`)
    }

    return response.json()
}

export async function submitEditorUpdates(levelId, worldLayer, objectLayer) {
    // Must be passed a content value from both maps
    const objectLayerList = [];
    objectLayer.forEach((value, key) => {
        objectLayerList.push({"position": key, "gid": value, "content": {}});
    });
    const worldLayerList = [];
    worldLayer.forEach((value, key) => {
        worldLayerList.push({"position": key, "gid": value, "content": {}});
    });
    try{
        await submitEditorRequest({
            "path": `/${levelId}/object-layer/batch`,
            "body": {
                "objects": objectLayerList
            }
        });
        await submitEditorRequest({
            "path": `/${levelId}/world-layer/batch`,
            "body": {
                "objects": worldLayerList
            }
        });
    }
    catch(e){
        console.error(e.message);
        return e.message
    }
    return 'Success.';
}