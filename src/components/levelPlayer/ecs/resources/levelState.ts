export type ClearConditionType = string;

export type ClearConditionState = {
  type: ClearConditionType;
  currentAmount: number;
  requiredAmount: number;
};

export type LevelStateResource = {
  clearCondition: ClearConditionState;
  doorOpen: boolean;
  isComplete: boolean;
  gameOver: boolean;
};

export type LevelStateOptions = {
  clearConditionType?: string;
  clearConditionRequiredAmount?: number;
};

export function createLevelStateResource(
  options: LevelStateOptions = {},
): LevelStateResource {
  return {
    clearCondition: {
      type: normalizeClearConditionType(options.clearConditionType),
      currentAmount: 0,
      requiredAmount: options.clearConditionRequiredAmount ?? 0,
    },
    doorOpen: false,
    isComplete: false,
    gameOver: false,
  };
}

export function createLevelStateResourceFromMapProperties(
  properties: Array<{ name?: string; value?: unknown }> = [],
): LevelStateResource {
  const typeProp = properties.find((property) => {
    return property.name === "ClearConditionType";
  });
  const amountProp = properties.find((property) => {
    return property.name === "ClearConditionAmount";
  });

  return createLevelStateResource({
    clearConditionType:
      typeof typeProp?.value === "string" ? typeProp.value : undefined,
    clearConditionRequiredAmount: Number(amountProp?.value ?? 0),
  });
}

export function isClearConditionSatisfied(
  levelState: LevelStateResource,
): boolean {
  const { type, currentAmount, requiredAmount } = levelState.clearCondition;
  return type === "none" || requiredAmount === 0 || currentAmount >= requiredAmount;
}

function normalizeClearConditionType(type: unknown): string {
  return String(type || "none").toLowerCase();
}
