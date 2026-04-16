export const CLEAR_CONDITION_TYPES = [
  { value: 'none',  label: 'Reach the exit' },
  { value: 'coin',  label: 'Collect coins'  },
  { value: 'box',   label: 'Destroy boxes'  },
  { value: 'slime', label: 'Kill slimes'    },
  { value: 'snail', label: 'Kill snails'    },
]

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
    return { type: condition.target, amount }
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
      target: type 
    }, 
    targetAmount: Number(amount) 
  }
}
