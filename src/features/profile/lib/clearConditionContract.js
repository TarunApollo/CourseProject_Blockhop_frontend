export const CLEAR_CONDITION_TYPES = [
  { value: 'none',  label: 'Reach the exit' },
  { value: 'coin',  label: 'Collect coins'  },
  { value: 'box',   label: 'Destroy boxes'  },
  { value: 'slime', label: 'Kill slimes'    },
  { value: 'snail', label: 'Kill snails'    },
]

/**
 * Reads the clearCondition object returned by the backend and returns
 * a flat { type, amount } shape suitable for the form.
 */
export function parseClearCondition(clearCondition) {
  if (!clearCondition || !clearCondition.condition || !clearCondition.condition.target) {
    return { type: 'none', amount: 0 }
  }
  return {
    type: clearCondition.condition.target,
    amount: clearCondition.targetAmount ?? 0,
  }
}

/**
 * Builds the clearCondition payload the backend expects.
 */
export function buildClearConditionPayload(type, amount) {
  if (type === 'none') {
    return { condition: {}, targetAmount: 0 }
  }
  return { condition: { target: type }, targetAmount: Number(amount) }
}
