import type { GameEvent } from "../eventQueue";
import {
  isClearConditionSatisfied,
  type LevelStateResource,
} from "../resources/levelState";

export function levelStateSystem(
  levelState: LevelStateResource,
  events: GameEvent[],
): void {
  for (const event of events) {
    switch (event.type) {
      case "CoinCollected":
        incrementClearConditionIfMatches(levelState, "coin");
        break;

      case "EnemyKilled":
        incrementClearConditionIfMatches(levelState, event.enemyType);
        break;

      case "BoxDestroyed":
        incrementClearConditionIfMatches(levelState, "box");
        break;

      case "LevelCompletedRequested":
        if (levelState.doorOpen) levelState.isComplete = true;
        break;
    }
  }

  if (isClearConditionSatisfied(levelState)) {
    levelState.doorOpen = true;
  }
}

function incrementClearConditionIfMatches(
  levelState: LevelStateResource,
  eventTarget: string,
): void {
  const conditionType = levelState.clearCondition.type;
  if (conditionType === "none") return;

  if (!eventTarget.toLowerCase().includes(conditionType)) return;

  levelState.clearCondition.currentAmount++;
}
