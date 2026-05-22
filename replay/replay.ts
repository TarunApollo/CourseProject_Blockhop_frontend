#!/usr/bin/env node

import * as fs from "fs";
import { createHeadlessLevelRuntime } from "../src/components/levelPlayer/ecs/headlessRuntime/create";
import { updateHeadlessLevel } from "../src/components/levelPlayer/ecs/headlessRuntime/update";
import type { PlayerInputState } from "../src/components/levelPlayer/ecs/systems/input/playerControlInputSystem";
import { createLevelDataFromTiledJson } from "../src/components/levelPlayer/ecs/levelData/createLevelDataFromTiledJson";

type InputLogEntry = {
  frame: number;
  input: PlayerInputState;
};

function die(msg: string): never {
  process.stderr.write(`[replay] FATAL: ${msg}\n`);
  process.exit(1);
}

const [levelJsonPath, inputLogPath] = process.argv.slice(2);
if (!levelJsonPath) {
  die("Usage: tsx replay.ts <levelJsonPath> [inputLogPath]");
}

const levelJson = JSON.parse(fs.readFileSync(levelJsonPath, "utf-8"));
const levelData = createLevelDataFromTiledJson(levelJson);

let inputLog: InputLogEntry[];
if (inputLogPath) {
  inputLog = JSON.parse(fs.readFileSync(inputLogPath, "utf-8"));
} else {
  inputLog = [];
}

const runtime = createHeadlessLevelRuntime(levelData);

// TODO: improve how we handle this.
const MAX_FRAMES = 60 * 60 * 10; // 10 minutes at 60 fps
let frame = 0;
let inputIdx = 0;

while (frame < MAX_FRAMES) {
  let input: PlayerInputState = {};

  while (inputIdx < inputLog.length) {
    const entry = inputLog[inputIdx];
    if (!entry || entry.frame !== frame) {
      break;
    }
    input = entry.input;
    inputIdx++;
  }

  const result = updateHeadlessLevel(runtime, { input });

  if (result.isComplete) {
    process.stdout.write(
      JSON.stringify({ valid: true, frame, reason: "level_complete" }) + "\n",
    );
    process.exit(0);
  }

  if (result.gameOver) {
    process.stdout.write(
      JSON.stringify({ valid: true, frame, reason: "game_over" }) + "\n",
    );
    process.exit(0);
  }

  frame++;
}

process.stdout.write(
  JSON.stringify({ valid: false, frame, reason: "timeout" }) + "\n",
);
process.exit(1);
