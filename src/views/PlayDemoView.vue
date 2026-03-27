<script setup>
import PlayDemo from '@/features/components/PlayDemo.vue';
import ReturnButton from '@/shared/components/ReturnButton.vue';
import MainLogo from '@/shared/components/MainLogo.vue';
import '@/assets/viewsStyle/PlayDemoView.css';
</script>

<template>
    <ReturnButton/>
    <MainLogo/>

    <div class="centered">
        <PlayDemo/>
    </div>
</template>