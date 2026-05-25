import Matter from "matter-js";
import { CT } from "../../core/ComponentTypes";
import type { Registry } from "../../core/Registry";
import type { PlayerOperation } from "../input/playerControlInputSystem";
import { lockRotation } from "../../matter/matterUtils";
import { LifeState } from "../../components/ComponentEnum";
import { PlayerCrouch } from "../../components";

const NORMAL_HEIGHT = 166;
const CROUCH_HEIGHT = 128;
const HEIGHT_DIFF = NORMAL_HEIGHT - CROUCH_HEIGHT;

export function playerCrouchSystem(
  registry: Registry,
  operation: PlayerOperation,
  groundBodies: Matter.Body[],
): void {
  const entities = registry.view([
    CT.Player,
    CT.PlayerCrouch,
    CT.PlayerClimb,
    CT.PlayerLife,
    CT.Physics,
    CT.Animator,
  ]);

  for (const entity of entities) {
    const crouch = registry.getComponent(entity, CT.PlayerCrouch);
    const climb = registry.getComponent(entity, CT.PlayerClimb);
    const life = registry.getComponent(entity, CT.PlayerLife);
    const physics = registry.getComponent(entity, CT.Physics);
    const animator = registry.getComponent(entity, CT.Animator);
    const body = physics?.body;

    if (!crouch || !climb || !life || !physics || !animator || !body) continue;
    if (life.lifeState === LifeState.DYING) continue;

    // cant crouch while climbing
    if (climb.isClimbing) {
      if (crouch.isCrouching) {
        uncrouch(body, crouch);
      }
      continue;
    }

    const wantsToCrouch = operation.climbDown;

    if (wantsToCrouch && !crouch.isCrouching) {
      crouch.isCrouching = true;
      Matter.Body.scale(body, 1, CROUCH_HEIGHT / NORMAL_HEIGHT);
      
      // scaling shrinks towards center shift body down so feet stay in place
      Matter.Body.setPosition(body, {
        x: body.position.x,
        y: body.position.y + HEIGHT_DIFF / 2,
      });
      lockRotation(body);
    } else if (!wantsToCrouch && crouch.isCrouching) {
      const ceilingRegion = {
        min: {
          x: body.bounds.min.x + 2,
          y: body.bounds.min.y - HEIGHT_DIFF - 2,
        },
        max: {
          x: body.bounds.max.x - 2,
          y: body.bounds.min.y,
        }
      };

      const bodiesAbove = Matter.Query.region(groundBodies, ceilingRegion);
      
      if (bodiesAbove.length === 0) {
        uncrouch(body, crouch);
      }
    }

    if (crouch.isCrouching) {
      animator.currentAnim = "duck";
    }
  }
}

function uncrouch(body: Matter.Body, crouch: PlayerCrouch): void {
  crouch.isCrouching = false;
  Matter.Body.scale(body, 1, NORMAL_HEIGHT / CROUCH_HEIGHT);
  Matter.Body.setPosition(body, {
    x: body.position.x,
    y: body.position.y - HEIGHT_DIFF / 2,
  });
  lockRotation(body);
}
