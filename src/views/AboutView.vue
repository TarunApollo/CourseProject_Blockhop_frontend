<script setup>
import BackButton from "@/shared/components/BackButton.vue";
import { gameVisualTokens } from "@/shared/lib/visualizationTokens";

const tokens = gameVisualTokens;
</script>

<template>
  <section class="relative min-h-[calc(100vh-2rem)] w-full overflow-hidden">
    <div class="fixed left-4 top-4 sm:left-10 sm:top-10 z-[100]">
      <BackButton to="/home" />
    </div>

    <div
      class="relative z-10 min-h-[calc(100vh-2rem)] px-4 py-6 sm:px-6 lg:px-8"
    >
      <div class="mx-auto flex w-full max-w-none flex-col items-center">
        <div class="w-full max-w-[600px] sm:max-w-[640px] lg:max-w-[720px] flex flex-col gap-8 sm:gap-10">
          <section :class="[tokens.backgrounds.primaryPanel, 'w-full p-5 sm:p-6']">
            <p :class="[tokens.text.accent, 'text-sm uppercase tracking-[0.25em]']">
              Welcome
            </p>
            <h2 :class="[tokens.text.primary, 'mt-2 text-3xl']">
              About Blockhop
            </h2>
            <p :class="[tokens.text.primary, 'mt-4 leading-relaxed']">
              Blockhop is a browser-based platformer game built as part of the SA4 project at USI.
              Run, jump, and hop your way through handcrafted levels — dodge enemies, collect coins,
              reach the exit door, and beat your own best time.
              Levels are created by the community using the built-in level editor, so there is always something new to play.
            </p>
          </section>

          <section :class="[tokens.backgrounds.secondaryPanel, 'w-full p-5']">
            <p :class="[tokens.text.accent, 'text-sm uppercase tracking-[0.22em]']">
              How It Works
            </p>

            <p :class="[tokens.text.primary, 'mt-4 font-semibold']">Controls</p>
            <table class="mt-2 w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th :class="[tokens.text.primary, 'text-left pb-1 pr-4 font-semibold border-b border-white/20']">Action</th>
                  <th :class="[tokens.text.primary, 'text-left pb-1 font-semibold border-b border-white/20']">Key</th>
                </tr>
              </thead>
              <tbody :class="tokens.text.primary">
                <tr><td class="py-1 pr-4">Move left / right</td><td>Arrow Left / Arrow Right</td></tr>
                <tr><td class="py-1 pr-4">Jump</td><td>Space</td></tr>
                <tr><td class="py-1 pr-4">Run</td><td>Shift</td></tr>
                <tr><td class="py-1 pr-4">Climb up / down a ladder</td><td>Arrow Up / Arrow Down</td></tr>
                <tr><td class="py-1 pr-4">Exit a ladder</td><td>Space</td></tr>
                <tr><td class="py-1 pr-4">Pick up a shell</td><td>Hold Z near the shell</td></tr>
                <tr><td class="py-1 pr-4">Throw the shell</td><td>Release Z</td></tr>
              </tbody>
            </table>

            <p :class="[tokens.text.primary, 'mt-5 font-semibold']">Gameplay</p>
            <p :class="[tokens.text.primary, 'mt-2 leading-relaxed']">
              Navigate each level from the starting point to the exit door.
              You start each run with <strong>2 hearts</strong>. Taking a hit from an enemy or hazard costs one heart; only losing both ends the run.
              Shells can be picked up and thrown to defeat enemies or trigger mechanisms.
              Coins are scattered throughout levels; collect them all for a perfect run.
              Every completed run is recorded. Once you finish a level at least once, a ghost appears on future runs — it replays the fastest verified completion on that level across all players, so you can see how you stack up against the best run globally.
            </p>

            <p :class="[tokens.text.primary, 'mt-5 font-semibold']">Level Editor</p>
            <p :class="[tokens.text.primary, 'mt-2 leading-relaxed']">
              Want to build your own levels? Open the Level Editor from the home screen.
              Use the tile selector on the side panel to choose what to place, then click or drag on the canvas to paint the level.
              Set a spawn point for the player and place an exit door — both are required before you can save.
              Add enemies, shells, coins, and hazards to make the level as challenging as you like.
              You can test the level at any time from inside the editor.
              When you are happy with your creation, publish it so other players can discover and play it.
            </p>
          </section>

          <section :class="[tokens.backgrounds.secondaryPanel, 'w-full p-5']">
            <p :class="[tokens.text.accent, 'text-sm uppercase tracking-[0.22em]']">
              The Team
            </p>
            <p :class="[tokens.text.primary, 'mt-4 leading-relaxed']">
              Blockhop was made by <strong>Team 4 — CoffeeBeans</strong> as part of the SA4 course project.
            </p>
            <p :class="[tokens.text.primary, 'mt-3 font-semibold']">Team Leaders</p>
            <ul :class="[tokens.text.primary, 'mt-1 list-disc list-inside leading-relaxed']">
              <li>Chengyu Yu</li>
              <li>Leon Yacopo Costa</li>
            </ul>
          </section>

          <section :class="[tokens.backgrounds.secondaryPanel, 'w-full p-5']">
            <p :class="[tokens.text.accent, 'text-sm uppercase tracking-[0.22em]']">
              Credits
            </p>
            <ul :class="[tokens.text.primary, 'mt-4 list-disc list-inside leading-relaxed space-y-1']">
              <li>Game engine: <a href="https://phaser.io/" target="_blank" rel="noopener" class="underline opacity-80 hover:opacity-100">Phaser 3</a></li>
              <li>Physics: <a href="https://brm.io/matter-js/" target="_blank" rel="noopener" class="underline opacity-80 hover:opacity-100">Matter.js</a></li>
              <li>Frontend framework: <a href="https://vuejs.org/" target="_blank" rel="noopener" class="underline opacity-80 hover:opacity-100">Vue 3</a> with <a href="https://vitejs.dev/" target="_blank" rel="noopener" class="underline opacity-80 hover:opacity-100">Vite</a></li>
              <li>Backend: <a href="https://spring.io/projects/spring-boot" target="_blank" rel="noopener" class="underline opacity-80 hover:opacity-100">Spring Boot</a></li>
              <li>Course: Software Architecture (SA4), USI in Lugano</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  </section>
</template>
