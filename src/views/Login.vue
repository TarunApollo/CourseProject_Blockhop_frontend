<script setup>
import {toggleLogin} from "@/stores/auth"

</script>
<template>
    Please, login or Register first...
    <!-- 
        This is a simulation of what is accessible to users before login and after
    -->
    <button @click="toggleLogin">LoginToggle</button>

</template>
<style scoped>
</style>