<script setup>
    const props = defineProps({
        level: {
            type: Object,
            required: true
        }
    })
</script>
<template>
    <div class="menu-button">
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
        <div class="description-class"> {{ props.level.description }} </div>
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
        width: 50%;
        height: 10em;
        visibility: visible;
        justify-content: center;
        align-items: center;
        display: flex;
    }


    .menu-button {
        padding: 1em 1em;
        background: #4ade80;
        color: #052e16;
        border: #181818 2px solid;
        font-family: 'Pixelify Sans', monospace;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        box-shadow: 0 5px 0 #166534, 0 8px 18px rgba(0,0,0,0.25);
        transition: transform 0.07s, box-shadow 0.07s;
    }

    .menu-button:hover {
        transform: translateY(-2px);
        background: #86efac;
    }

    .description-class {
        /* word-wrap: break-word; */
        white-space: initial;
        background-color: rgba(255, 255, 255, 0.2);
        padding: 0.5em, 0.5em, 0.5em, 0.5em;
    }

</style>