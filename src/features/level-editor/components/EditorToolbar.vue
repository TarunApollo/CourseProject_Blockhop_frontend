<template>
  <div class="toolbar flex items-center gap-4 px-4 py-2 bg-editor-bg-light border-b-2 border-editor-border">
    <div class="layer-toggle flex rounded-lg overflow-hidden border-2 border-editor-border">
      <button
        class="px-4 py-2 font-semibold transition-colors bg-editor-border text-white"
      >
        Ground
      </button>
      <button
        class="px-4 py-2 font-semibold transition-colors bg-editor-canvas text-editor-text hover:bg-editor-bg"
      >
        Objects
      </button>
    </div>

    <div class="tools flex gap-2">
      <button
        class="p-2 rounded-lg border-2 border-editor-border bg-editor-bg-active transition-all"
        title="Paintbrush"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-editor-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
      <button
        class="p-2 rounded-lg border-2 border-transparent hover:border-editor-border bg-editor-canvas transition-all"
        title="Eraser"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-editor-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>

    <button
      class="validate-btn ml-auto px-4 py-2 rounded-lg border-2 border-editor-border bg-editor-canvas text-editor-text font-semibold hover:bg-editor-bg-active transition-colors flex items-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      Validate
    </button>
  </div>
</template>
