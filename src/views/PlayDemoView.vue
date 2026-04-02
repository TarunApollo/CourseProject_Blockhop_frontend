<script setup>
import PlayDemo from '@/features/play-demo/components/PlayDemo.vue';
import ReturnButton from '@/shared/components/ReturnButton.vue';
import MainLogo from '@/shared/components/MainLogo.vue';
//
</script>

<template>
    <div class="view-play-demo">
    <ReturnButton/>
    <MainLogo/>

    <div class="centered">
        <PlayDemo/>
    </div>
    </div>
</template>