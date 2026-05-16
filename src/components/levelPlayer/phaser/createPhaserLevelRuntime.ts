import Matter from "matter-js";
import { createBackground } from "./background.js";
import { setupGlobalAnimations } from "./animationSetup.js";
import { createHeadlessLevelRuntime } from "../ecs/headlessRuntime/create.js";
import { isClearConditionSatisfied } from "../ecs/resources/levelState.js";
import { processRuntimeEvents } from "../ecs/systems/runtimeEvents.js";
import {
    createPhaserRenderContext,
    getGameObject,
} from "./phaserAdapter.js";
import { ComponentTypes as CT } from "../ecs/core/ComponentTypes.js";
import { InputRecorder } from "../ecs/inputRecorder.js";
import { createTileMetadataResource } from "./tileMetadata.js";
import { renderSystem } from "./renderSystem.js";
import type { PhaserLevelCallbacks, PhaserLevelRuntime } from "./updatePhaserLevel.js";
import type { Registry } from "../ecs/core/Registry.js";
import type { Door, Physics, PlayerControl, Transform } from "../ecs/components/index.js";
import type { PhaserRenderContext } from "./phaserAdapter.js";
import type { TileMetadataResource } from "./tileMetadata.js";

type RuntimeOptions = {
    callbacks?: PhaserLevelCallbacks;
    levelData: LevelData;
};

type PhaserDisplayRuntime = {
    mapSize: { width: number; height: number };
    playerEntity: number;
    registry: Registry;
    renderContext: PhaserRenderContext;
    tileMetadata: TileMetadataResource;
};

// PhaserRuntime means Runtime + Phaser rendering and input.
// Phaser reads the map, then wraps the Runtime with sprites, camera, and keys.
export function createPhaserLevelRuntime(
    scene: Phaser.Scene,
    options: RuntimeOptions,
) {
    const phaserLevel = createPhaserLevelData(scene);
    const headlessRuntime = createHeadlessLevelRuntime(options.levelData);
    const renderContext = createPhaserRenderContext(scene);
    const cursors = scene.input.keyboard!.createCursorKeys();
    setupGlobalAnimations(scene, phaserLevel.groundTileset!);
    const player = setupPhaserDisplay(scene, {
        mapSize: headlessRuntime.mapSize,
        playerEntity: headlessRuntime.playerEntity,
        registry: headlessRuntime.registry,
        renderContext,
        tileMetadata: phaserLevel.tileMetadata,
    });

    const runtime = {
        ...headlessRuntime,
        renderContext,
        map: phaserLevel.map,
        worldLayer: phaserLevel.worldLayer,
        groundTileset: phaserLevel.groundTileset,
        tileMetadata: phaserLevel.tileMetadata,
        state: createPhaserRuntimeState(),
        callbacks: options.callbacks ?? {},
        player,
        cursors,
        inputRecorder: new InputRecorder(),
        completeLevel: () => completeLevel(scene, runtime),
    };

    installDevCheats(scene, runtime);

    runtime.callbacks.onRunStarted?.();
    runtime.callbacks.onSceneReady?.(scene);
    return runtime;
}

function createPhaserLevelData(scene : Phaser.Scene) {
    const map = scene.make.tilemap({ key: "map" });
    const groundTiles = map.addTilesetImage("tiles")!;
    const worldLayer = map.createLayer("World", groundTiles, 0, 0)!;
    const groundTileset = map.getTileset("tiles")!;
    const tileMetadata = createTileMetadataResource(groundTileset);

    worldLayer.setCollisionByExclusion([-1]);

    return {
        map,
        worldLayer,
        groundTileset,
        tileMetadata,
    };
}

function createPhaserRuntimeState() {
    return {
        isDying: false,
        isLevelComplete: false,
        forcedFlyY: null,
        sineFly: null,
        doorStartPositions: new Map(),
    };
}

function setupPhaserDisplay(scene : Phaser.Scene, runtime : PhaserDisplayRuntime) {
    createBackground(scene, runtime.mapSize);
    // first load for game objects
    renderSystem(runtime.renderContext, runtime.registry, runtime.tileMetadata);

    const player = getGameObject(runtime.renderContext, runtime.playerEntity);

    scene.cameras.main.setBounds(
        0,
        0,
        runtime.mapSize.width,
        runtime.mapSize.height,
    );
    scene.cameras.main.setZoom(
        scene.cameras.main.height / runtime.mapSize.height,
    );
    if (player) {
        scene.cameras.main.startFollow(player);
    }

    return player;
}


function completeLevel(scene : Phaser.Scene, runtime : PhaserLevelRuntime) {
    if (runtime.state.isLevelComplete) return;
    runtime.state.isLevelComplete = true;

    freezePlayerBody(runtime);

    const inputLog = runtime.inputRecorder.getLog();
    const totalFrames = runtime.inputRecorder.frame;

    const doorId = runtime.registry.view([CT.Door])[0]!;
    const doorPosition = runtime.registry.getComponent<Transform>(doorId, CT.Transform);
    if (!runtime.player || !doorPosition) return;

    scene.tweens.add({
        targets: runtime.player,
        x: doorPosition.x,
        duration: 400,
        ease: "Quad.easeInOut",
        onComplete: () => {
            scene.tweens.add({
                targets: runtime.player,
                alpha: 0,
                scaleX: 0,
                scaleY: 0,
                duration: 300,
                ease: "Quad.easeIn",
                onComplete: () => {
                    scene.cameras.main.flash(500, 255, 255, 255);
                    scene.time.delayedCall(400, () => {
                        runtime.callbacks.onLevelCompleted?.({ inputLog, totalFrames });
                    });
                },
            });
        },
    });
}

function installDevCheats(scene: Phaser.Scene, runtime: PhaserLevelRuntime) {
    if (!import.meta.env.DEV) return;

    primeDoorStartPositions(runtime);

    const cheats = {
        setGravity: (y = 2.5) => {
            const nextY = Number(y);
            if (!Number.isFinite(nextY)) return;
            runtime.engine.world.gravity.x = 0;
            runtime.engine.world.gravity.y = nextY;
        },
        setVelocityX: (v = 0) => {
            const body = getPlayerBody(runtime);
            const next = Number(v);
            if (!body || !Number.isFinite(next)) return;
            Matter.Body.setVelocity(body, { x: next, y: body.velocity.y });
        },
        setVelocityY: (v = 0) => {
            const body = getPlayerBody(runtime);
            const next = Number(v);
            if (!body || !Number.isFinite(next)) return;
            Matter.Body.setVelocity(body, { x: body.velocity.x, y: next });
        },
        teleport: (x = 0, y = 0) => {
            const body = getPlayerBody(runtime);
            const nextX = Number(x);
            const nextY = Number(y);
            if (!body || !Number.isFinite(nextX) || !Number.isFinite(nextY)) return;
            Matter.Body.setPosition(body, { x: nextX, y: nextY });
        },
        noclip: () => {
            const control = getPlayerControl(runtime);
            if (!control) return;
            control.noclipActive = !control.noclipActive;
        },
        fly: (y = getPlayerBody(runtime)?.position.y) => {
            const nextY = Number(y);
            if (!Number.isFinite(nextY)) return;
            const control = getPlayerControl(runtime);
            if (control) control.noclipActive = false;
            runtime.state.sineFly = null;
            runtime.state.forcedFlyY = nextY;
        },
        sinFly: (
            amplitude = 96,
            periodMs = 1000,
            centerY = getPlayerBody(runtime)?.position.y,
        ) => {
            const nextAmplitude = Number(amplitude);
            const nextPeriodMs = Number(periodMs);
            const nextCenterY = Number(centerY);
            if (!Number.isFinite(nextAmplitude)
                || !Number.isFinite(nextPeriodMs)
                || nextPeriodMs <= 0
                || !Number.isFinite(nextCenterY)) return;

            const control = getPlayerControl(runtime);
            if (control) control.noclipActive = false;
            runtime.state.forcedFlyY = null;
            runtime.state.sineFly = {
                amplitude: nextAmplitude,
                periodMs: nextPeriodMs,
                centerY: nextCenterY,
                startTime: scene.time.now,
            };
        },
        stopFly: () => {
            runtime.state.forcedFlyY = null;
            runtime.state.sineFly = null;
        },
        setFps: (fps = 60) => {
            const nextFps = Number(fps);
            if (!Number.isFinite(nextFps) || nextFps <= 0) return;

            const loop = scene.game.loop as Phaser.Core.TimeStep & {
                _target?: number;
                raf: { delay: number };
                deltaHistory: number[];
                resetDelta: () => void;
            };
            const frameDelay = 1000 / nextFps;
            loop.targetFps = nextFps;
            loop.actualFps = nextFps;
            loop._target = frameDelay;
            loop.raf.delay = frameDelay;
            loop.deltaHistory.fill(frameDelay);
            loop.resetDelta();
            runtime.engine.timing.timeScale = nextFps / 60;
        },
        fakeClearCondition: (type = "coin", amount = 1) => {
            const count = Math.max(1, Math.floor(Number(amount) || 1));
            for (let i = 0; i < count; i++) {
                emitCheatClearCondition(runtime, type);
            }
        },
        spoofClearConditionAt: (type = "coin", _x = 0, _y = 0, repeats = 1) => {
            const count = Math.max(1, Math.floor(Number(repeats) || 1));
            for (let i = 0; i < count; i++) {
                emitCheatClearCondition(runtime, type);
            }
        },
        forceDoorOpen: () => {
            runtime.levelState.doorOpen = true;
            syncDoorOpen(runtime, true);
        },
        moveDoorToPlayer: (offsetX = 0, offsetY = 0) => {
            const body = getPlayerBody(runtime);
            const doorEntity = nearestDoorEntity(runtime);
            const dx = Number(offsetX) || 0;
            const dy = Number(offsetY) || 0;
            if (!body || doorEntity === undefined) return;
            moveDoor(runtime, doorEntity, body.position.x + dx, body.position.y + 64 + dy);
        },
        moveNearestDoor: (dx = 0, dy = 0) => {
            const doorEntity = nearestDoorEntity(runtime);
            if (doorEntity === undefined) return;
            const transform = runtime.registry.getComponent<Transform>(doorEntity, CT.Transform);
            if (!transform) return;
            moveDoor(runtime, doorEntity, transform.x + (Number(dx) || 0), transform.y + (Number(dy) || 0));
        },
        resetDoors: () => {
            for (const [entity, start] of runtime.state.doorStartPositions.entries()) {
                moveDoor(runtime, entity, start.x, start.y);
            }
        },
        fakeGround: (v = true) => {
            const control = getPlayerControl(runtime);
            if (!control) return;
            control.forceGroundState = Boolean(v);
        },
        disconnect: () => {
            console.warn("[anticheat] no websocket in replay mode");
        },
    };

    const cheatsWindow = window as Window & { __cheats?: typeof cheats };
    cheatsWindow.__cheats = cheats;
    scene.events.once("shutdown", () => {
        if (cheatsWindow.__cheats === cheats) {
            delete cheatsWindow.__cheats;
        }
    });
}

function getPlayerControl(runtime: PhaserLevelRuntime) {
    return runtime.registry.getComponent<PlayerControl>(runtime.playerEntity, CT.Player);
}

function primeDoorStartPositions(runtime: PhaserLevelRuntime) {
    runtime.state.doorStartPositions.clear();
    for (const entity of runtime.registry.view([CT.Door, CT.Transform])) {
        const transform = runtime.registry.getComponent<Transform>(entity, CT.Transform);
        if (!transform) continue;
        runtime.state.doorStartPositions.set(entity, { x: transform.x, y: transform.y });
    }
}

function nearestDoorEntity(runtime: PhaserLevelRuntime) {
    const body = getPlayerBody(runtime);
    const doors = runtime.registry.view([CT.Door, CT.Transform]);
    if (!body || doors.length === 0) return undefined;
    const firstDoor = doors[0];
    if (firstDoor === undefined) return undefined;
    return doors.reduce((best, entity) => {
        const bestTransform = runtime.registry.getComponent<Transform>(best, CT.Transform);
        const nextTransform = runtime.registry.getComponent<Transform>(entity, CT.Transform);
        if (!bestTransform) return entity;
        if (!nextTransform) return best;
        const bestDx = Math.abs(body.position.x - bestTransform.x);
        const nextDx = Math.abs(body.position.x - nextTransform.x);
        return nextDx < bestDx ? entity : best;
    }, firstDoor);
}

function moveDoor(runtime: PhaserLevelRuntime, entity: number, x: number, y: number) {
    const transform = runtime.registry.getComponent<Transform>(entity, CT.Transform);
    const physics = runtime.registry.getComponent<Physics>(entity, CT.Physics);
    if (!transform) return;
    transform.x = x;
    transform.y = y;
    if (physics?.body) {
        Matter.Body.setPosition(physics.body, { x, y: y - 64 });
    }
}

function emitCheatClearCondition(runtime: PhaserLevelRuntime, type: string) {
    const normalized = String(type ?? "coin").toLowerCase();
    const event = normalized.includes("coin")
        ? { type: "CoinCollected" as const, coinType: "Item_Coin_Gold" }
        : normalized.includes("box")
            ? { type: "BoxDestroyed" as const, content: undefined }
            : normalized.includes("snail")
                ? { type: "EnemyKilled" as const, enemyType: "Enemy_Snail" }
                : { type: "EnemyKilled" as const, enemyType: "Enemy_Slime_Normal" };

    processRuntimeEvents(runtime, [event]);

    if (event.type === "CoinCollected") {
        runtime.callbacks.onCoinCollected?.(event.coinType);
    } else if (event.type === "BoxDestroyed") {
        runtime.callbacks.onBoxDestroyed?.(event.content);
    } else {
        runtime.callbacks.onEnemyKilled?.(event.enemyType);
    }

    if (isClearConditionSatisfied(runtime.levelState)) {
        runtime.levelState.doorOpen = true;
        syncDoorOpen(runtime, true);
    }
}

function syncDoorOpen(runtime: PhaserLevelRuntime, isOpen: boolean) {
    for (const entity of runtime.registry.view([CT.Door])) {
        const door = runtime.registry.getComponent<Door>(entity, CT.Door);
        if (!door) continue;
        door.isOpen = isOpen;
    }
}

function freezePlayerBody(runtime : PhaserLevelRuntime) {
    const body = getPlayerBody(runtime);
    if (!body) return;

    Matter.Body.setStatic(body, true);
    Matter.Body.setVelocity(body, { x: 0, y: 0 });
}

function getPlayerBody(runtime : PhaserLevelRuntime) {
    return runtime.registry.getComponent<Physics>(runtime.playerEntity, CT.Physics)?.body;
}
