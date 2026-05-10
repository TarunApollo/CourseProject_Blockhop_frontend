import * as Comp from "../../components";
import { ComponentTypes as CT } from "../../core/ComponentTypes";
import type {
    CollisionHandlerContext,
    MatchedCollision,
} from "./collisionUtils";
import {
    requestHorizontalWalkerReverse,
    requestPlayerBounce,
} from "./collisionEvents";
import {
    isPlayerStomp,
    isSideContact,
} from "./collisionUtils";
import {
    pauseShellRespawn,
    restartShellRespawn,
} from "./shellStateMachine";
import {
    getPhysicsBody,
} from "../../adapter/matterAdapter";

/**
 * player -> shell
 * resting shell side contact kicks it
 * moving shell stomp stops it
 * moving shell side contact reverses it
 */
export function handlePlayerShell(
    context: CollisionHandlerContext,
    collision: MatchedCollision,
): void {
    const registry = context.registry;
    const shellEntity = collision.target;
    const playerEntity = collision.subject;
    const shellWalker = registry.getComponent<Comp.HorizontalWalker>(
        shellEntity,
        CT.HorizontalWalker,
    );
    const hazard = registry.getComponent<Comp.Hazard>(shellEntity, CT.Hazard);
    const playerBody = getPhysicsBody(registry, playerEntity);

    //for resting shell side contact will kick it
    if (!shellWalker.active && isSideContact(collision.pair)) {
        kickShellAwayFromPlayer(context, playerEntity, shellEntity, shellWalker, hazard);
        return;
    }

    //stomp will stop the shell and make player bounce
    if (isPlayerStomp(playerBody, collision.pair)) {
        stopShell(context, shellEntity, shellWalker, hazard);
        requestPlayerBounce(context, playerEntity);
        return;
    }

    //side contact active shell will reverse shell
    //damage will be handled by player->shell end 
    if (isSideContact(collision.pair)) {
        requestHorizontalWalkerReverse(context, shellEntity);
    }
}

/**
 * A moving shell becomes dangerous only after the player separates from it
 * This prevents the kick that activates the shell from immediately dealing damage
 */
export function handlePlayerShellEnd(
    context: CollisionHandlerContext,
    collision: MatchedCollision,
): void {
    const registry = context.registry;
    const shellWalker = registry.getComponent<Comp.HorizontalWalker>(
        collision.target,
        CT.HorizontalWalker,
    );
    const hazard = registry.getComponent<Comp.Hazard>(
        collision.target,
        CT.Hazard,
    );

    if (shellWalker?.active && hazard) {
        hazard.active = true;
        hazard.targetPlayer = true;
    }
}

/**
 * helper for kick shell
 */
function kickShellAwayFromPlayer(
    context: CollisionHandlerContext,
    playerEntity: number,
    shellEntity: number,
    shellWalker: Comp.HorizontalWalker,
    hazard: Comp.Hazard | undefined,
): void {
    const player = getPhysicsBody(context.registry, playerEntity);
    const shell = getPhysicsBody(context.registry, shellEntity);

    //the kick dir will depends on player dir
    //because resting shell has velocity = 0
    shellWalker.direction = player.position.x < shell.position.x ? 1 : -1;
    shellWalker.active = true;
    shellWalker.skipVelCheck = true;

    if (hazard) {
        hazard.active = true;
        hazard.targetEnemy = true;
        hazard.targetPlayer = false;
    }

    pauseShellRespawn(context, shellEntity);
}

/**
 * make shell stop moving
 */
function stopShell(
    context: CollisionHandlerContext,
    shellEntity: number,
    shellWalker: Comp.HorizontalWalker,
    hazard: Comp.Hazard | undefined,
): void {
    shellWalker.active = false;
    shellWalker.direction = 0;
    shellWalker.skipVelCheck = false;

    if (hazard) {
        hazard.active = false;
        hazard.targetPlayer = false;
    }

    restartShellRespawn(context, shellEntity);
}
