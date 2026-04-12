// Composable to manage the game background using Phaser

import { onMounted, onBeforeUnmount, ref, nextTick } from "vue";
import Phaser from "phaser";
import {
    LAYER_ASSETS,
    SUN_CONFIG,
} from "@/shared/lib/gameBackground/constants";
import { getBackgroundLayout } from "@/shared/lib/gameBackground/layout";
import { drawSun } from "@/shared/lib/gameBackground/sun";

/**
 * Phaser scene responsible for rendering and animating the home background layers.
 * @extends Phaser.Scene
 * @requires phaser
 * @requires LAYER_ASSETS
 * @requires getBackgroundLayout
 * @requires drawSun
 */
class HomeScreen extends Phaser.Scene {
    /**
     * Creates a new HomeScreen scene instance.
     * @returns {void}
     */
    constructor() {
        super({ key: "HomeScreen" });
        this.cloudSpeed = 25;
        this.treeSpeed = 35;
        this.grassSpeed = 50;
        this.sunRotationSpeed = 18;
    }

    /**
     * Preloads all image assets required by the background layers.
     *
     * @returns {void}
     * @throws {Error} May throw error if an asset fails to load or the loader is unavailable.
     * @requires LAYER_ASSETS
     * @requires Phaser.Loader.LoaderPlugin
     */
    preload() {
        this.load.image("bg_sky", LAYER_ASSETS.sky);
        this.load.image("bg_clouds", LAYER_ASSETS.clouds);
        this.load.image("bg_trees", LAYER_ASSETS.trees);
        this.load.image("bg_grass", LAYER_ASSETS.grass);
        if (!this.load) {
            throw new Error("Phaser loader is not available");
        }
    }

    /**
     * Creates scene game objects, configures animation tweens, and binds resize handling.
     * @returns {void}
     * @throws {Error} May throw error if expected textures are missing or scene objects cannot be created.
     * @requires getBackgroundLayout
     * @requires drawSun
     * @requires Phaser.GameObjects.GameObjectFactory
     * @requires Phaser.Tweens.TweenManager
     * @requires Phaser.Textures.TextureManager
     * @requires Phaser.Scale.ScaleManager
     */
    create() {
        const { width, height } = this.scale;
        const layout = getBackgroundLayout(width, height);

        this.cloudsTex = this.textures.get("bg_clouds").getSourceImage();
        this.treesTex = this.textures.get("bg_trees").getSourceImage();
        this.grassTex = this.textures.get("bg_grass").getSourceImage();
        if (!this.cloudsTex || !this.treesTex || !this.grassTex) {
            throw new Error("One or more required textures are missing");
        }

        this.bgSky = this.add
            .image(0, 0, "bg_sky")
            .setOrigin(0, 0)
            .setDisplaySize(layout.screenWidth, layout.skyH)
            .setDepth(0);

        this.bgClouds = this.add
            .tileSprite(
                0,
                layout.cloudsY,
                layout.screenWidth,
                layout.cloudsH,
                "bg_clouds",
            )
            .setOrigin(0, 0)
            .setTileScale(layout.cloudsH / this.cloudsTex.height)
            .setDepth(1);

        this.bgTrees = this.add
            .tileSprite(
                0,
                layout.treesY,
                layout.screenWidth,
                layout.treesH,
                "bg_trees",
            )
            .setOrigin(0, 0)
            .setTileScale(layout.treesH / this.treesTex.height)
            .setDepth(2);

        this.bgGrass = this.add
            .tileSprite(
                0,
                layout.grassY,
                layout.screenWidth,
                layout.grassH,
                "bg_grass",
            )
            .setOrigin(0, 0)
            .setTileScale(layout.grassH / this.grassTex.height)
            .setDepth(3);

        this.sun = this.add.graphics();
        this.sun.setPosition(width - SUN_CONFIG.offsetX, SUN_CONFIG.y);
        this.sun.setDepth(4);
        drawSun(this.sun);

        if (
            !this.bgClouds ||
            !this.bgTrees ||
            !this.bgGrass ||
            !this.bgSky ||
            !this.sun
        ) {
            throw new Error("One or more background layers failed to create");
        }

        this.scale.on("resize", this.handleResize, this);
    }

    /**
     * Advances background movement every frame without tween-loop resets.
     * @param {number} _time - Current game time in ms.
     * @param {number} delta - Elapsed ms since previous frame.
     * @returns {void}
     */
    update(_time, delta) {
        const dt = delta / 1000;

        if (this.bgClouds) this.bgClouds.tilePositionX += this.cloudSpeed * dt;
        if (this.bgTrees) this.bgTrees.tilePositionX += this.treeSpeed * dt;
        if (this.bgGrass) this.bgGrass.tilePositionX += this.grassSpeed * dt;
        if (this.sun)
            this.sun.angle =
                (this.sun.angle + this.sunRotationSpeed * dt) % 360;
    }

    /**
     * Recalculates and reapplies layer sizes/positions when the game viewport changes.
     * @param {Phaser.Structs.Size} gameSize - New game viewport size provided by Phaser.
     * @returns {void}
     * @throws {TypeError} Thrown when `gameSize` is missing required numeric width or height values.
     * @requires getBackgroundLayout
     * @requires Phaser.Structs.Size
     * @requires cloudsTex
     * @requires treesTex
     * @requires grassTex
     */
    handleResize(gameSize) {
        if (
            !gameSize ||
            typeof gameSize.width !== "number" ||
            typeof gameSize.height !== "number"
        ) {
            throw new TypeError("Invalid gameSize provided to handleResize");
        }
        const layout = getBackgroundLayout(gameSize.width, gameSize.height);

        this.bgSky.setDisplaySize(layout.screenWidth, layout.skyH);

        this.bgClouds
            .setPosition(0, layout.cloudsY)
            .setDisplaySize(layout.screenWidth, layout.cloudsH)
            .setTileScale(layout.cloudsH / this.cloudsTex.height);

        this.bgTrees
            .setPosition(0, layout.treesY)
            .setDisplaySize(layout.screenWidth, layout.treesH)
            .setTileScale(layout.treesH / this.treesTex.height);

        this.bgGrass
            .setPosition(0, layout.grassY)
            .setDisplaySize(layout.screenWidth, layout.grassH)
            .setTileScale(layout.grassH / this.grassTex.height);

        this.sun.setPosition(
            layout.screenWidth - SUN_CONFIG.offsetX,
            SUN_CONFIG.y,
        );
    }
}

/**
 * A function to wait for the Phaser game instance to emit the 'ready' event.
 * Resolves when the game is ready, or rejects if the game is destroyed or if a timeout occurs.
 * @param {Phaser.Game} gameInstance - The Phaser game instance to monitor for readiness.
 * @param {number} - Optional timeout in milliseconds before rejecting if not ready.
 * @returns {Promise<void>} A promise that resolves when the game is ready, or rejects on error/timeout.
 * @throws {Error} May throw errors if the game instance is invalid or if events cannot be listened to.
 * @requires Phaser.Game
 */
function waitForGameReady(gameInstance, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
        if (!gameInstance || !gameInstance.events) {
            reject(
                new Error(
                    "Phaser game events are not available during initialization",
                ),
            );
            return;
        }

        let timerId;

        const cleanup = () => {
            clearTimeout(timerId);
            gameInstance.events.off("ready", onReady);
            gameInstance.events.off("destroy", onDestroy);
        };

        const onReady = () => {
            cleanup();
            resolve();
        };

        const onDestroy = () => {
            cleanup();
            reject(
                new Error(
                    "Phaser game was destroyed before finishing initialization",
                ),
            );
        };

        timerId = setTimeout(() => {
            cleanup();
            reject(new Error("Phaser game initialization timed out"));
        }, timeoutMs);

        gameInstance.events.once("ready", onReady);
        gameInstance.events.once("destroy", onDestroy);
    });
}

/**
 * Custom Vue composable to initialize and manage a Phaser game
 * instance for the home screen background.
 * Handles game creation, asset loading, animation setup, and
 * cleanup on component unmount.
 * @returns {Object} An object containing a `gameContainer` ref to be bound to the Phaser game parent element.
 * @throws {Error} May throw errors related to Phaser game initialization.
 * @requires Phaser
 * @requires HomeScreen
 */
export function useGameBackground() {
    const gameContainer = ref(null);
    let game = null;
    let resizeTimerId = null;
    let isReloading = false;

    const destroyGame = () => {
        if (!game) {
            return;
        }

        game.scene.keys.HomeScreen?.scale.off("resize");
        game.destroy(true);
        game = null;
    };

    const initGame = async () => {
        if (!gameContainer.value) {
            throw new Error(
                "Missing Phaser game container element for initialization",
            );
        }

        game = new Phaser.Game({
            type: Phaser.AUTO,
            parent: gameContainer.value,
            scene: [HomeScreen],
            scale: {
                mode: Phaser.Scale.RESIZE,
                width: window.innerWidth,
                height: window.innerHeight,
            },
            render: {
                pixelArt: true,
                roundPixels: true,
            },
        });

        await waitForGameReady(game);
    };

    const reloadGame = async () => {
        if (isReloading) {
            return;
        }

        isReloading = true;

        try {
            destroyGame();
            await nextTick();
            await initGame();
        } finally {
            isReloading = false;
        }
    };

    const handleWindowResize = () => {
        if (resizeTimerId) {
            clearTimeout(resizeTimerId);
        }


        resizeTimerId = setTimeout(() => {
            void reloadGame();
        }, 150);
    };

    onMounted(async () => {
        await nextTick();

        try {
            await initGame();
            window.addEventListener("resize", handleWindowResize);
        } catch (error) {
            destroyGame();

            if (error instanceof Error) {
                throw error;
            }

            throw new Error("Failed to initialize Phaser game instance");
        }
    });

    /**
     * Cleans up the Phaser game instance.
     * @returns {void}
     * @throws {Error} May throw errors if the game instance cannot be destroyed or if event listeners cannot be removed.
     * @requires Phaser.Game
     * @requires HomeScreen
     */
    onBeforeUnmount(() => {
        window.removeEventListener("resize", handleWindowResize);

        if (resizeTimerId) {
            clearTimeout(resizeTimerId);
            resizeTimerId = null;
        }

        destroyGame();
    });

    return {
        gameContainer,
    };
}
