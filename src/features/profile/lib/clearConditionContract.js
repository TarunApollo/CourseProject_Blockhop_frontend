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

export function validateClearConditionInput(type, amount) {
  if (!CLEAR_CONDITION_TYPES.some((option) => option.value === type)) {
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
