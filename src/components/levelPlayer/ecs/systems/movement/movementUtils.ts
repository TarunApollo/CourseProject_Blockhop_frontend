import Matter from "matter-js";

export function setVelocityX(body: Matter.Body, x: number): void {
  Matter.Body.setVelocity(body, { x, y: body.velocity.y });
}

export function setVelocityY(body: Matter.Body, y: number): void {
  Matter.Body.setVelocity(body, { x: body.velocity.x, y });
}

export function lockRotation(body: Matter.Body): void {
  Matter.Body.setAngularVelocity(body, 0);
  Matter.Body.setAngle(body, 0);
}
