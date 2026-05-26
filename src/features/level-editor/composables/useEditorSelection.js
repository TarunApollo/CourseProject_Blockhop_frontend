import { selection } from "./editorStore";

export function useEditorSelection() {
  let selectionRafId = null;
  let pendingSelectionEnd = null;

  function startSelection(x, y) {
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
  }

  return {
    startSelection,
    updateSelection,
    endSelection,
  };
}
