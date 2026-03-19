<script setup>
import { useRouter } from 'vue-router'
import { login } from '@/stores/auth'

const router = useRouter()

function handleLogin() {
    login()
    router.push('/home')
}

</script>
<template>
     <!-- 
        This is a simulation of what is accessible to users before login and after
    -->
    <section class="login-content">
        <div class="login-container">
            <h1 class="game-title">Blockhop</h1>
            <p class="game-description">Jump into an exciting adventure</p>
            <button @click="handleLogin" class="login-button">Login</button>
        </div>
    </section>

</template>
<style scoped>
.login-content {
    min-height: calc(100vh - 120px);
    display: flex;
    align-items: center;
    justify-content: center;
}

.login-container {
    text-align: center;
    max-width: 400px;
}

.game-title {
    font-size: 4.4rem;
    font-weight: bold;
    color: white;
    margin: 0 0 1rem 0;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.game-description {
    font-size: 1.7rem;
    color: white;
    margin: 0 0 2rem 0;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.login-button {
    padding: 0.75rem 2rem;
    font-size: 1.1rem;
    background-color: white;
    color: #2b9d5c;
    border: none;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
}

.login-button:hover {
    background-color: #f0f0f0;
    transform: scale(1.05);
}
</style>