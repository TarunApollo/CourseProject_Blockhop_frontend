import {
  activeLayer,
  objectLayer,
  selection,
  worldLayer,
} from "./editorStore";
import { getKey } from "./editorAutotileUtils";

export function useEditorSelection() {
  let selectionRafId = null;
  let pendingSelectionEnd = null;

  function startSelection(x, y) {
    selection.tiles = [];
    selection.isSelecting = true;
    selection.selectionStart = { x, y };
    selection.selectionEnd = { x, y };
  }

  function updateSelection(x, y) {
    if (!selection.isSelecting) return;
    pendingSelectionEnd = { x, y };
    if (selectionRafId) return;
    selectionRafId = requestAnimationFrame(() => {
      selectionRafId = null;
      if (pendingSelectionEnd) {
        selection.selectionEnd = pendingSelectionEnd;
        pendingSelectionEnd = null;
      }
    });
  }

  function endSelection() {
    if (selectionRafId) {
      cancelAnimationFrame(selectionRafId);
      selectionRafId = null;
    }
    if (pendingSelectionEnd) {
      selection.selectionEnd = pendingSelectionEnd;
      pendingSelectionEnd = null;
    }
    selection.isSelecting = false;

    if (!selection.selectionStart || !selection.selectionEnd) return;

    const start = selection.selectionStart;
    const end = selection.selectionEnd;
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    const layer = activeLayer.value === "ground" ? worldLayer : objectLayer;
    const layerName = activeLayer.value;
    const selectedTiles = [];

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const tile = layer.get(getKey(x, y));
        if (!tile) continue;
        selectedTiles.push({
          x,
          y,
          layer: layerName,
          tile: { ...tile },
          tileId: tile.tileId,
          compositeId: tile.compositeId,
        });
      }
    }

    selection.tiles = selectedTiles;
  }

  function clearSelection() {
    selection.tiles = [];
    selection.isSelecting = false;
    selection.isDragging = false;
    selection.selectionStart = null;
    selection.selectionEnd = null;
    selection.dragOffset = null;
    selection.previousTiles = [];
  }

  function isTileSelected(x, y) {
    return selection.tiles.some((tile) => tile.x === x && tile.y === y);
  }

  function getSelectionBounds() {
    if (selection.tiles.length === 0) return null;
    const xs = selection.tiles.map((tile) => tile.x);
    const ys = selection.tiles.map((tile) => tile.y);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  }

  return {
    startSelection,
    updateSelection,
    endSelection,
    clearSelection,
    isTileSelected,
    getSelectionBounds,
  };
}
