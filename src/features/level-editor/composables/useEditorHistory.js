import {
  worldLayer,
  objectLayer,
  undoStack,
  redoStack,
  MAX_UNDO_STATES,
  isDirty,
} from "./editorStore";

export function useEditorHistory() {
  function saveState() {
    const state = {
      worldLayer: new Map(worldLayer),
      objectLayer: new Map(objectLayer),
    };
    undoStack.push(state);
    if (undoStack.length > MAX_UNDO_STATES) {
      undoStack.shift();
    }
    redoStack.length = 0;
  }

  function undo() {
    if (undoStack.length === 0) return;

    const currentState = {
      worldLayer: new Map(worldLayer),
      objectLayer: new Map(objectLayer),
    };
    redoStack.push(currentState);
    if (redoStack.length > MAX_UNDO_STATES) {
      redoStack.shift();
    }

    const previousState = undoStack.pop();
    worldLayer.clear();
    objectLayer.clear();

    for (const [key, value] of previousState.worldLayer) {
      worldLayer.set(key, value);
    }
    for (const [key, value] of previousState.objectLayer) {
      objectLayer.set(key, value);
    }
  }

  function redo() {
    if (redoStack.length === 0) return;

    const currentState = {
      worldLayer: new Map(worldLayer),
      objectLayer: new Map(objectLayer),
    };
    undoStack.push(currentState);

    const nextState = redoStack.pop();
    worldLayer.clear();
    objectLayer.clear();

    for (const [key, value] of nextState.worldLayer) {
      worldLayer.set(key, value);
    }
    for (const [key, value] of nextState.objectLayer) {
      objectLayer.set(key, value);
    }
  }

  function canUndo() {
    return undoStack.length > 0;
  }

  function canRedo() {
    return redoStack.length > 0;
  }

  function markSaved() {
    undoStack.length = 0;
    redoStack.length = 0;
    isDirty.value = false;
  }

  return {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    markSaved,
  };
}
