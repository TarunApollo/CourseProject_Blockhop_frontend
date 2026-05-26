import { ref, reactive } from "vue";

export const activeLayer = ref("ground");
export const selectedTool = ref("paintbrush");
export const selectedTile = ref(null);

export const worldLayer = reactive(new Map());
export const objectLayer = reactive(new Map());

export const compositeIdState = reactive({ counter: 0 });

export const selection = reactive({
  isSelecting: false,
  selectionStart: null,
  selectionEnd: null,
  tiles: [],
  isDragging: false,
  dragOffset: null,
  previousTiles: [],
  clipboard: [],
});

export const previewMode = ref(false);
export const showGids = ref(false);
export const isDirty = ref(false);
export const levelTitle = ref("");
export const levelDescription = ref("");
export const clearConditionType = ref("none");
export const clearConditionTargetAmount = ref(0);

export const levelTheme = ref("grass");

export const undoStack = reactive([]);
export const redoStack = reactive([]);
export const MAX_UNDO_STATES = 50;

export const highlightedTile = ref(null);
