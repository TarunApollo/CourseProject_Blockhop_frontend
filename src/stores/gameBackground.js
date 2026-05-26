import { defineStore } from "pinia";
import Phaser from "phaser";
import { BackgroundScene } from "@/shared/lib/BackgroundScene.js";
import { LoginScene } from "@/features/login-page/lib/LoginScene.js";

export const useGameBackgroundStore = defineStore("gameBackground", {
  state: () => ({
    game: null,
  }),
  actions: {
    init(container) {
      if (this.game) return;
      this.game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: container,
        backgroundColor: "#87ceeb",
        scene: [LoginScene, BackgroundScene],
        physics: {
          default: "arcade",
          arcade: { gravity: { y: 600 } },
        },
        scale: {
          mode: Phaser.Scale.RESIZE,
        },
      });
    },
    showScene(key) {
      if (!this.game || this.game.scene.isActive(key)) return;
      this.game.scene.getScenes(true).forEach((s) => s.scene.stop());
      this.game.scene.start(key);
    },
    stopAll() {
      if (!this.game) return;
      this.game.scene.getScenes(true).forEach((s) => s.scene.stop());
    },
  },
});
