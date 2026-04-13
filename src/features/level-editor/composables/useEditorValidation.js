import {GRID_HEIGHT} from '../lib/editorConstants'
import {submitEditorRequest} from "@/features/level-editor/lib/submitEditorUpdates.js";

export function useEditorValidation() {
    function validateLevel(worldLayer, objectLayer) {
        const errors = []
        const warnings = []

        const startFlagGid = 69
        const doorClosedGid = 116
        const doorOpenGid = 117

        const objectEntries = [...objectLayer.entries()]

        const startFlags = objectEntries.filter(([_, obj]) => obj.gid === startFlagGid)
        if (startFlags.length === 0) {
            errors.push('Level must have a Start Flag')
        } else if (startFlags.length > 1) {
            errors.push('Level can only have one Start Flag')
        }

        const exitDoors = objectEntries.filter(
            ([_, obj]) => obj.gid === doorClosedGid || obj.gid === doorOpenGid
        )
        if (exitDoors.length === 0) {
            errors.push('Level must have an Exit Door')
        }

        for (const [pos, obj] of objectEntries) {
            if (worldLayer.has(pos)) {
                errors.push(`Object at (${pos}) overlaps with ground tile`)
            }
        }

        if (startFlags.length === 1) {
            const [pos] = startFlags[0]
            const [x, y] = pos.split(',').map(Number)
            const belowPos = `${x},${y + 1}`
            if (!worldLayer.has(belowPos) && y + 1 < GRID_HEIGHT) {
                warnings.push('Start Flag should be placed above ground')
            }
        }

        if (worldLayer.size === 0) {
            warnings.push('Level has no ground tiles')
        }

        const valid = errors.length === 0;

        return {
            valid,
            errors,
            warnings
        }
    }

    function submitEditorUpdates(levelId, worldLayer, objectLayer) {
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
            submitEditorRequest({
                "path": `/${levelId}/object-layer/batch`,
                "body": {
                    "objects": objectLayerList
                }
            });
            submitEditorRequest({
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

    return {validateLevel, submitEditorUpdates}
}
