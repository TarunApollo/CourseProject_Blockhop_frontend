<script setup>
</script>
<template>
    <div class="shared-mainlogo">
                <div class="top-title">
                        <h1 class="home-title">Block<span class="home-hop">hop</span></h1>
        </div>
    </div>
</template>

<style scoped>
.top-title {
    position: relative;
    z-index: 9;
    display: flex;
    width: 100%;
    justify-content: center;
    margin: 0;
    margin-top: clamp(0.5rem, 2.5vh, 2rem);
    padding-inline: clamp(0.5rem, 3vw, 1.5rem);
    pointer-events: auto;
}

.home-title {
    display: inline-block;
    white-space: nowrap;
    text-align: center;
    font-family: var(--font-game);
    font-size: clamp(1.75rem, 8vw, 7rem);
    line-height: 1;
    color: #ffffff;
    text-shadow: 3px 3px 0 var(--color-forest), 5px 5px 0 rgba(var(--color-black-rgb), 0.25);
    transform-style: preserve-3d;
    animation: title-wobble 6s ease-in-out infinite alternate;
}

.home-hop {
    color: var(--color-game-primary);
    text-shadow: 3px 3px 0 var(--color-game-primary-shadow), 5px 5px 0 rgba(var(--color-black-rgb), 0.25);
}
</style>