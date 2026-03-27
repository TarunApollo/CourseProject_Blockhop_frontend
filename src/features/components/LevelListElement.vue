<script setup>
import { useLevelListElement } from '@/features/composables/useLevelListElement'
import '@/features/style/LevelListElement.css'

const props = defineProps({
  level: {
    type: Object,
    required: true
  }
})

const { name, description, timesPlayed, timesCompleted } = useLevelListElement(props)
</script>
<template>
    <div class="preview">
        LEVEL PREVIEW
    <!-- An image must be inserted here, once we make an image generator -->
    </div>
    <h2>{{ name }}</h2>
    <p>
        Times played: {{ timesPlayed }}
        -- 
        Completes: {{ timesCompleted }}
    </p>
    <div class="description-class"> {{ description }} </div>

</template>