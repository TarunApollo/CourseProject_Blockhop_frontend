import Phaser from "phaser";
import { Registry } from "../../core/Registry";
import { ComponentTypes as CT } from "../../core/ComponentTypes";
import * as Comp from "../../components";
import { EventBus } from "../../../EventBus";

type HorizontalWalkerReverseRequestedPayload = {
  entity: number;
};

export function registerHorizontalMovementEvents(registry: Registry): void {
  EventBus.on(
    "HorizontalWalkerReverseRequested",
    ({ entity }: HorizontalWalkerReverseRequestedPayload) => {
      const walker = registry.getComponent<Comp.HorizontalWalker>(
        entity,
        CT.HorizontalWalker,
      );
      if (walker) reverseWalker(walker);
    },
  );
}



export function horizontalMovementSystem(registry: Registry, groundBodies: any[]) {
  const MatterField = (Phaser.Physics.Matter as any).Matter;

  registry.forEach(
    [CT.HorizontalWalker, CT.Physics, CT.Sprite],
    (_id, walkerRaw, _physicsRaw, spriteRaw) => {
      const walker = walkerRaw as Comp.HorizontalWalker;
      const sprite = spriteRaw as Comp.Sprite;

      const gameObject = sprite.gameObject as Phaser.Physics.Matter.Sprite;
      if (!gameObject || !gameObject.body) return;

      //handle static shell
      if (!walker.active) {
        stopHorizontalWalker(gameObject);
        return;
      }

      if (walker.turnAtLedge && isLedgeAhead(gameObject, walker, groundBodies, MatterField)) {
        reverseWalker(walker);
      }

      else if (walker.skipVelCheck) {
        walker.skipVelCheck = false;
      }

      else if (isAtWall(gameObject, walker, groundBodies, MatterField)) {
        reverseWalker(walker);
      }

      applyWalkerMovement(gameObject, walker);
    });
}

//Helper for hanlde movement
function isLedgeAhead(gameObject: Phaser.Physics.Matter.Sprite, walker: Comp.HorizontalWalker, groundBodies: any[], MatterField: any): boolean {
  const { x, y, displayWidth, displayHeight } = gameObject;
  const checkX = x + walker.direction * (displayWidth * 0.5 + 4);
  const checkY = y + displayHeight * 0.5 + 8;
  const ledgeAhead = MatterField.Query.point(groundBodies, { x: checkX, y: checkY }).length === 0;

  return ledgeAhead;
}


/**
 * velocity heuristic + query to check whether at wall
 */
function isAtWall(gameObject: Phaser.Physics.Matter.Sprite, walker: Comp.HorizontalWalker, groundBodies: any[], MatterField: any): boolean {
  const { x, y, displayWidth } = gameObject;
  const vx = gameObject.body.velocity.x;
  const velocityBlocked =
    (walker.direction > 0 && vx < walker.speed * 0.5) ||
    (walker.direction < 0 && vx > -walker.speed * 0.5);
  const aheadX = x + walker.direction * (displayWidth * 0.5 + 4);
  const wallAhead =
    MatterField.Query.point(groundBodies, { x: aheadX, y: y }).length > 0;
  return wallAhead && velocityBlocked;
}

/**
 * reverse dir and set skip velocity check
 */
function reverseWalker(walker: Comp.HorizontalWalker): void {
  walker.direction *= -1;
  walker.skipVelCheck = true;
}


function stopHorizontalWalker(gameObject: Phaser.Physics.Matter.Sprite): void {
  gameObject.setVelocityX(0);
  lockRotation(gameObject);
}

function lockRotation(gameObject: Phaser.Physics.Matter.Sprite): void {
  gameObject.setAngularVelocity(0);
  gameObject.setAngle(0);
}


function applyWalkerMovement(gameObject: Phaser.Physics.Matter.Sprite, walker: Comp.HorizontalWalker): void {
  {
    gameObject.setVelocityX(walker.speed * walker.direction);
    gameObject.setFlipX(walker.direction > 0);
    lockRotation(gameObject);
  }
}

