import { Registry } from "../core/Registry";
import { ComponentTypes as CT } from "../core/ComponentTypes";
import * as Comp from "../components";

/**
 * Updates animations and sprite mirroring using the Animator component.
 */
export function animationSystem(registry: Registry) {
  registry.forEach([CT.Animator, CT.Sprite], (_id, animatorRaw, spriteRaw) => {
    const animator = animatorRaw as Comp.Animator;
    const sprite = spriteRaw as Comp.Sprite;

    if (!sprite.gameObject) return;
    const gameObject = sprite.gameObject as any;

    if (animator.currentAnim && gameObject.anims) {
      if (gameObject.anims.currentAnim?.key !== animator.currentAnim) {
        console.log(`Playing animation "${animator.currentAnim}" on entity ${_id}`);
        gameObject.anims.play(animator.currentAnim, true);
      }
    } else if (animator.currentAnim && !gameObject.anims) {
      console.warn(`Entity ${_id} has Animator component with "${animator.currentAnim}" but gameObject has no anims property! (type: ${gameObject.type})`);
    }

    gameObject.flipX = animator.flipX;
  });
}
