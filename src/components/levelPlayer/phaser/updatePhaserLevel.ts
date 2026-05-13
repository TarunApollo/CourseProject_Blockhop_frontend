import * as Matter from "matter-js";
import Phaser from "phaser";
import { animationEventSystem, animationSystem } from "./animationSystem";
import {
  renderSystem,
  type PhaserRenderContext,
} from "./phaserAdapter";
import { syncTransformsFromMatter } from "../ecs/adapter/matterAdapter";
import * as Comp from "../ecs/components";
import { ComponentTypes as CT } from "../ecs/core/ComponentTypes";
import type { GameEvent } from "../ecs/eventQueue";
import type { TileMetadataResource } from "./tileMetadata";
import {
  updateRuntime,
  type LevelRuntime,
} from "../ecs/headlessRuntime/update";
import { processRuntimeEvents } from "../ecs/headlessRuntime/update";
import {
  type PlayerOperation,
} from "../ecs/systems/movement/playerMovementSystem";

type PhaserRuntimeState = {
  isDying: boolean;
  isLevelComplete: boolean;
};

type PhaserLevelRuntime = LevelRuntime & {
  renderContext: PhaserRenderContext;
  tileMetadata: TileMetadataResource;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  state: PhaserRuntimeState;
  callbacks: {
    onAttemptFailed?: (payload: { reason: string }) => void;
    onCoinCollected?: (coinType: string) => void;
    onEnemyKilled?: (enemyType: string) => void;
    onBoxDestroyed?: (content?: string) => void;
  };
  completeLevel: () => void;
};

export function updatePhaserLevel(
  runtime: PhaserLevelRuntime,
  scene: Phaser.Scene,
  _time: number,
  delta: number,
): void {
  // First update ECS + Matter. Then update Phaser sprites and animations.
  const events = updateRuntime(runtime, {
    input: playerOperationFromCursors(runtime.cursors),
    deltaMs: delta,
    skipPlayerInput: runtime.state.isDying || runtime.state.isLevelComplete,
  });

  if (runtime.state.isLevelComplete) {
    lockPlayerBodyRotation(runtime);
    // When level completes, we freeze the physics body and tween the sprite.
    // If we run syncTransforms, it overwrites the tween, so we skip it.
    processPhaserGameEvents(runtime, scene, events);
    animationSystem(runtime.renderContext, runtime.registry);
    return;
  }

  if (runtime.state.isDying) {
    lockPlayerBodyRotation(runtime);
    setPlayerAnimation(runtime, "idle");
  }

  processPhaserGameEvents(runtime, scene, events);
  syncTransformsFromMatter(runtime.registry);
  renderSystem(runtime.renderContext, runtime.registry, runtime.tileMetadata);
  animationSystem(runtime.renderContext, runtime.registry);
}

function processPhaserGameEvents(
  runtime: PhaserLevelRuntime,
  scene: Phaser.Scene,
  events: GameEvent[],
): void {
  
  const wasComplete = runtime.levelState.isComplete;
  processRuntimeEvents(runtime, events);

  if (!wasComplete && runtime.levelState.isComplete) {
    runtime.completeLevel();
  }

  animationEventSystem(
    runtime.renderContext,
    runtime.tileMetadata,
    events,
    runtime.events,
  );
  forwardGameEventsToUi(runtime, scene, events);
}

function playerOperationFromCursors(
  cursors: Phaser.Types.Input.Keyboard.CursorKeys,
): PlayerOperation {
  return {
    left: cursors.left.isDown,
    right: cursors.right.isDown,
    jump: cursors.up.isDown,
    run: cursors.shift.isDown,
  };
}

function getPlayerBody(runtime: LevelRuntime): Matter.Body | undefined {
  return runtime.registry.getComponent<Comp.Physics>(
    runtime.playerEntity,
    CT.Physics,
  )?.body;
}

function lockPlayerBodyRotation(runtime: LevelRuntime): void {
  const body = getPlayerBody(runtime);
  if (!body) return;

  Matter.Body.setAngularVelocity(body, 0);
  Matter.Body.setAngle(body, 0);
}

function setPlayerAnimation(runtime: LevelRuntime, animationKey: string): void {
  const animator = runtime.registry.getComponent<Comp.Animator>(
    runtime.playerEntity,
    CT.Animator,
  );
  if (animator) animator.currentAnim = animationKey;
}

function restartAfterFailure(
  runtime: PhaserLevelRuntime,
  scene: Phaser.Scene,
  reason: string,
): void {
  if (runtime.state.isDying) return;

  runtime.state.isDying = true;
  runtime.callbacks.onAttemptFailed?.({ reason });
  scene.time.delayedCall(300, () => {
    scene.scene.restart();
  });
}

function forwardGameEventsToUi(
  runtime: PhaserLevelRuntime,
  scene: Phaser.Scene,
  events: GameEvent[],
): void {
  for (const event of events) {
    switch (event.type) {
      case "CoinCollected":
        runtime.callbacks.onCoinCollected?.(event.coinType);
        break;
      case "EnemyKilled":
        runtime.callbacks.onEnemyKilled?.(event.enemyType);
        break;
      case "BoxDestroyed":
        runtime.callbacks.onBoxDestroyed?.(event.content);
        break;
      case "PlayerDied":
        if (runtime.state.isDying) break;
        runtime.state.isDying = true;
        scene.cameras.main.shake(150, 0.012);
        runtime.callbacks.onAttemptFailed?.({ reason: "damage" });
        scene.time.delayedCall(1500, () => {
          scene.scene.restart();
        });
        break;
      case "GameOver":
        if (runtime.state.isDying) break;
        restartAfterFailure(runtime, scene, "fall");
        break;
    }
  }
}
