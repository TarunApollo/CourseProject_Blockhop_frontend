<script setup>
    const props = defineProps({
        level: {
            type: Object,
            required: true
        }
    })
</script>
<template>
    <div class="singleElement">
        <div class="preview">
            LEVEL PREVIEW
        <!-- An image must be inserted here, once we make an image generator -->
        </div>
        <h2>{{ props.level.name }}</h2>
        <p>
            Times played: {{ props.level.timesPlayed }}
            -- 
            Completes: {{ props.level.timesCompleted }}
        </p>
        <h4> {{ props.level.description }} </h4>
    </div>

</template>
<style scoped>
    .singleElement {
        background-color: rgba(20, 20, 20, 0.1);
        padding: 0.5em 0.5em 0.5em 0.5em;
        border-radius: 1em;
        
    }
    .preview {
        background-color: rgba(128, 48, 255, 0.1);
        width: 14em;
        height: 10em;
        visibility: visible;
        justify-content: center;
        align-items: center;
        display: flex;
    }
</style>