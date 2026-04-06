<script setup>
import { ref } from 'vue'
import { useEditorState } from '../composables/useEditorState'
import { useEditorValidation } from '../composables/useEditorValidation'

const { activeLayer, selectedTool, setActiveLayer, setSelectedTool, worldLayer, objectLayer } = useEditorState()
const { validateLevel } = useEditorValidation()

const validationResults = ref(null)

function handleValidate() {
  validationResults.value = validateLevel(worldLayer, objectLayer)
}

function clearValidation() {
  validationResults.value = null
}
</script>

<template>
  <div class="toolbar flex items-center gap-4 px-4 py-2 bg-editor-bg-light border-b-2 border-editor-border relative z-20">
    <div class="layer-toggle flex rounded-lg overflow-hidden border-2 border-editor-border">
      <button
        @click="setActiveLayer('ground')"
        :class="[
          'px-4 py-2 font-semibold transition-colors',
          activeLayer === 'ground' ? 'bg-editor-border text-white' : 'bg-editor-canvas text-editor-text hover:bg-editor-bg'
        ]"
      >
        Ground
      </button>
      <button
        @click="setActiveLayer('object')"
        :class="[
          'px-4 py-2 font-semibold transition-colors',
          activeLayer === 'object' ? 'bg-editor-border text-white' : 'bg-editor-canvas text-editor-text hover:bg-editor-bg'
        ]"
      >
        Objects
      </button>
    </div>

    <div class="tools flex gap-2">
      <button
        @click="setSelectedTool('select')"
        :class="[
          'p-2 rounded-lg border-2 transition-all',
          selectedTool === 'select'
            ? 'border-editor-border bg-editor-bg-active'
            : 'border-transparent hover:border-editor-border bg-editor-canvas'
        ]"
        title="Select"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-editor-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      </button>
      <button
        @click="setSelectedTool('paintbrush')"
        :class="[
          'p-2 rounded-lg border-2 transition-all',
          selectedTool === 'paintbrush'
            ? 'border-editor-border bg-editor-bg-active'
            : 'border-transparent hover:border-editor-border bg-editor-canvas'
        ]"
        title="Paintbrush"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-editor-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
      <button
        @click="setSelectedTool('eraser')"
        :class="[
          'p-2 rounded-lg border-2 transition-all',
          selectedTool === 'eraser'
            ? 'border-editor-border bg-editor-bg-active'
            : 'border-transparent hover:border-editor-border bg-editor-canvas'
        ]"
        title="Eraser"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-editor-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>

    <button
      @click="handleValidate"
      class="validate-btn ml-auto px-4 py-2 rounded-lg border-2 border-editor-border bg-editor-canvas text-editor-text font-semibold hover:bg-editor-bg-active transition-colors flex items-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      Validate
    </button>

    <Teleport to="body">
      <div
        v-if="validationResults"
        class="validation-results fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="clearValidation"
      >
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <h2 class="text-xl font-bold mb-4" :class="validationResults.valid ? 'text-green-600' : 'text-red-600'">
            {{ validationResults.valid ? 'Level Valid!' : 'Validation Errors' }}
          </h2>

          <ul v-if="validationResults.errors.length" class="mb-4">
            <li v-for="error in validationResults.errors" :key="error" class="text-red-600 mb-1">
              {{ error }}
            </li>
          </ul>

          <ul v-if="validationResults.warnings.length" class="mb-4">
            <li v-for="warning in validationResults.warnings" :key="warning" class="text-yellow-600 mb-1">
              {{ warning }}
            </li>
          </ul>

          <button
            @click="clearValidation"
            class="w-full py-2 rounded-lg bg-editor-border text-white font-semibold hover:bg-editor-border-hover transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
