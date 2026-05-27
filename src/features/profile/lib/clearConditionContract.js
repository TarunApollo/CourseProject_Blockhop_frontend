import { getCachedTileCatalog } from '@/shared/lib/fetchTileCatalog'

const BASE_CONDITIONS = [
    { value: 'none', label: 'Reach the exit' },
    { value: 'coin', label: 'Collect coins' },
    { value: 'box', label: 'Destroy boxes' },
]

function formatType(catalog) {
    if (!catalog || !catalog.tiles) return []
    return catalog.tiles
        .filter(tile => tile.category === 'enemy')
        .map(tile => {
            const parts = tile.type.replace(/^Enemy_/, '').split('_')
            parts.reverse()
            const formattedType = parts.join(' ') + 's'
            return {
                value: tile.id,
                label: `Kill ${formattedType}`
            }
        })
}

export function getClearConditionTypes(catalog) {
    if (!catalog) return BASE_CONDITIONS

    const enemyConditions = formatType(catalog)
    return [...BASE_CONDITIONS, ...enemyConditions]
}

function getBackendTargetName(type) {
    if (type.startsWith('enemy.')) {
        return type.replace(/^enemy\./, '').replaceAll('.', '_');
    }
    return type;
}

function normalizeEnemyTarget(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/^enemy[._]/, '')
        .replaceAll('.', '_')
}

/**
 * Reads the clearCondition object returned by the backend and returns
 * a flat { type, amount } object for the form.
 * 
 * The backend Condition uses a "type" property ("none" or "some")
 * for polymorphism.
 */
export function parseClearCondition(clearCondition) {
    if (!clearCondition || !clearCondition.condition) {
        return { type: 'none', amount: 0 }
    }

    const { condition, targetAmount } = clearCondition
    const amount = targetAmount ?? 0

    if (condition.type === 'some' && condition.target) {
        let frontendType = condition.target;

        // convert backend 'slime' to frontend 'enemy.slime.normal'
        const catalog = getCachedTileCatalog();
        if (catalog && catalog.tiles) {
            const normalizedTarget = normalizeEnemyTarget(condition.target)
            const matchedTile = catalog.tiles.find(t =>
                t.category === 'enemy' &&
                (normalizeEnemyTarget(t.id) === normalizedTarget ||
                    (condition.target === 'slime' && t.id === 'enemy.slime.normal'))
            );
            if (matchedTile) {
                frontendType = matchedTile.id;
            }
        }
        return { type: frontendType, amount }
    }

    // Default 
    return { type: 'none', amount: 0 }
}

/**
 * Builds the clearCondition payload and obeys to the backend contract.
 * 
 * The backend expects the "condition" object to have a "type" property
 * to differentiate between NoClearCondition and SomeClearCondition.
 */
export function buildClearConditionPayload(type, amount) {
    if (!type || type === 'none') {
        return {
            condition: { type: 'none' },
            targetAmount: 0
        }
    }

    return {
        condition: {
            type: 'some',
            target: getBackendTargetName(type)
        },
        targetAmount: Number(amount)
    }
}

export function validateClearConditionInput(type, amount) {
    const catalog = getCachedTileCatalog()
    const validTypes = getClearConditionTypes(catalog)
    if (!validTypes.some((option) => option.value === type)) {
        return 'Clear condition is invalid.'
    }

    if (type === 'none') {
        return ''
    }

    const amountNumber = Number(amount)

    if (!Number.isFinite(amountNumber)) {
        return 'Target amount is required.'
    }

    if (!Number.isInteger(amountNumber) || amountNumber < 1) {
        return 'Target amount must be a natural number (1 or greater).'
    }

    if (amountNumber > 100) {
        return 'Maximum target amount is 100.'
    }

    return ''
}
