import * as Matter from "matter-js";
import { animationEventSystem, animationSystem } from "./animationSystem";
import type { PhaserRenderContext } from "./phaserAdapter";
import { renderSystem } from "./renderSystem";
import { syncTransformsFromMatter } from "../ecs/adapter/matterAdapter";
import * as Comp from "../ecs/components";
import { ComponentTypes as CT } from "../ecs/core/ComponentTypes";
import type { GameEvent } from "../ecs/eventQueue";
import type { TileMetadataResource } from "./tileMetadata";
import {
  updateRuntime,
  type LevelRuntime,
} from "../ecs/headlessRuntime/update";
import {
  playerOperationFromInput,
  type PlayerInputState,
} from "../ecs/systems/inputSystem";
import { InputRecorder } from "../ecs/inputRecorder";
import { processRuntimeEvents } from "../ecs/systems/runtimeEvents";

type PhaserRuntimeState = {
  isDying: boolean;
  isLevelComplete: boolean;
  forcedFlyY: number | null;
  sineFly: {
    amplitude: number;
    periodMs: number;
    centerY: number;
    startTime: number;
  } | null;
  doorStartPositions: Map<number, { x: number; y: number }>;
};

export type LevelCompletedPayload = {
  inputLog: ReturnType<InputRecorder["getLog"]>;
  totalFrames: number;
};

export type PhaserLevelCallbacks = {
  onSceneReady?: (scene: Phaser.Scene) => void;
  onRunStarted?: () => void;
  onAttemptFailed?: (payload: { reason: string }) => void;
  onCoinCollected?: (coinType: string) => void;
  onEnemyKilled?: (enemyType: string) => void;
  onBoxDestroyed?: (content?: string) => void;
  onLevelCompleted?: (payload: LevelCompletedPayload) => void;
};

export type PhaserLevelRuntime = LevelRuntime & {
  renderContext: PhaserRenderContext;
  tileMetadata: TileMetadataResource;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  state: PhaserRuntimeState;
  callbacks: PhaserLevelCallbacks;
  player: Phaser.GameObjects.Sprite | undefined;
  inputRecorder: InputRecorder;
  completeLevel: () => void;
};

export function updatePhaserLevel(
  runtime: PhaserLevelRuntime,
  scene: Phaser.Scene,
  _time: number,
  delta: number,
): void {
  const input = playerInputFromCursors(runtime.cursors);
  runtime.inputRecorder.record(input);

  const events = updateRuntime(runtime, {
    input: playerOperationFromInput(input),
    deltaMs: delta,
    skipPlayerInput: runtime.state.isDying || runtime.state.isLevelComplete,
  });

  applyRuntimeCheats(runtime, _time);

  if (runtime.state.isLevelComplete) {
    processPhaserGameEvents(runtime, scene, events);
    animationSystem(runtime.renderContext, runtime.registry);
    return;
  }

  processPhaserGameEvents(runtime, scene, events);
  syncTransformsFromMatter(runtime.registry);
  renderSystem(runtime.renderContext, runtime.registry, runtime.tileMetadata);
  animationSystem(runtime.renderContext, runtime.registry);
}

function applyRuntimeCheats(
  runtime: PhaserLevelRuntime,
  time: number,
): void {
  const physics = runtime.registry.getComponent<Comp.Physics>(
    runtime.playerEntity,
    CT.Physics,
  );
  const body = physics?.body;
  if (!body) return;

  if (runtime.state.forcedFlyY !== null) {
    Matter.Body.setVelocity(body, { x: body.velocity.x, y: 0 });
    Matter.Body.setPosition(body, { x: body.position.x, y: runtime.state.forcedFlyY });
    return;
  }

  const sineFly = runtime.state.sineFly;
  if (!sineFly) return;

  const phase = ((time - sineFly.startTime) / sineFly.periodMs) * Math.PI * 2;
  Matter.Body.setVelocity(body, { x: body.velocity.x, y: 0 });
  Matter.Body.setPosition(body, {
    x: body.position.x,
    y: sineFly.centerY + Math.sin(phase) * sineFly.amplitude,
  });
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

  animationEventSystem(runtime.renderContext, runtime.tileMetadata, events);
  forwardGameEventsToUi(runtime, scene, events);
}

function playerInputFromCursors(
  cursors: Phaser.Types.Input.Keyboard.CursorKeys,
): PlayerInputState {
  return {
    left: cursors.left.isDown,
    right: cursors.right.isDown,
    jump: cursors.up.isDown,
    run: cursors.shift.isDown,
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
