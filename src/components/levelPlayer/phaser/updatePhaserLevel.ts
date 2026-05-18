import { animationEventSystem, animationSystem } from "./animationSystem";
import type { PhaserRenderContext } from "./phaserAdapter";
import { renderSystem } from "./renderSystem";
import { syncTransformsFromMatter } from "../ecs/adapter/matterAdapter";
import type { GameEvent } from "../ecs/eventQueue";
import type { TileMetadataResource } from "./tileMetadata";
import {
    LevelRuntime,
  updateRuntime,
} from "../ecs/headlessRuntime/update";
import {
  playerOperationFromInput,
  type PlayerInputState,
} from "../ecs/systems/inputSystem";
import { processRuntimeEvents } from "../ecs/systems/runtimeEvents";
import {
  DEATH_RESTART_DELAY,
  DEATH_SHAKE_DURATION,
  DEATH_SHAKE_INTENSITY,
  FALL_RESTART_DELAY,
} from "./phaserConstants";

type PhaserRuntimeState = {
  isDying: boolean;
  isLevelComplete: boolean;
};

export type PhaserLevelCallbacks = {
  onSceneReady?: (scene: Phaser.Scene) => void;
  onRunStarted?: () => void;
  onAttemptFailed?: (payload: { reason: string }) => void;
  onCoinCollected?: (coinType: string) => void;
  onEnemyKilled?: (enemyType: string) => void;
  onBoxDestroyed?: (content?: string) => void;
  onLevelCompleted?: () => void;
};

export type PhaserLevelRuntime = LevelRuntime & {
  renderContext: PhaserRenderContext;
  tileMetadata: TileMetadataResource;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  throwKey: Phaser.Input.Keyboard.Key;
  state: PhaserRuntimeState;
  callbacks: PhaserLevelCallbacks;
  player: Phaser.GameObjects.Sprite | undefined;
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
    input: playerOperationFromInput(
      playerInputFromCursors(runtime.cursors, runtime.throwKey),
    ),
    deltaMs: delta,
    skipPlayerInput: runtime.state.isDying || runtime.state.isLevelComplete,
  });

  if (runtime.state.isLevelComplete) {
    processPhaserGameEvents(runtime, scene, events);
    syncTransformsFromMatter(runtime.registry);
    renderSystem(runtime.renderContext, runtime.registry, runtime.tileMetadata);
    animationSystem(runtime.renderContext, runtime.registry);
    return;
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

  animationEventSystem(runtime.renderContext, runtime.tileMetadata, events, {
    onCoinPopComplete: runtime.callbacks.onCoinCollected,
  });
  forwardGameEventsToUi(runtime, scene, events);
}

function playerInputFromCursors(
  cursors: Phaser.Types.Input.Keyboard.CursorKeys,
  throwKey: Phaser.Input.Keyboard.Key,
): PlayerInputState {
  return {
    left: cursors.left.isDown,
    right: cursors.right.isDown,
    jump: cursors.up.isDown,
    run: cursors.shift.isDown,
    throw: throwKey.isDown,
  };
}

function restartAfterFailure(
  runtime: PhaserLevelRuntime,
  scene: Phaser.Scene,
  reason: string,
): void {
  if (runtime.state.isDying) return;

  runtime.state.isDying = true;
  runtime.callbacks.onAttemptFailed?.({ reason });
  scene.time.delayedCall(FALL_RESTART_DELAY, () => {
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
        if (event.animated) break;
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
        scene.cameras.main.shake(
          DEATH_SHAKE_DURATION,
          DEATH_SHAKE_INTENSITY,
        );
        runtime.callbacks.onAttemptFailed?.({ reason: "damage" });
        scene.time.delayedCall(DEATH_RESTART_DELAY, () => {
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
