<template>
  <main class="home-view">
    <h1 class="home-title">Home</h1>
    <p class="home-subtitle">You are logged in and ready to play.</p>
  </main>
</template>

<style scoped>
.home-view {
  min-height: calc(100vh - 120px);
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #63c88a;
}

.home-view::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background-color: var(--vt-c-white);
}

.home-title {
  color: inherit;
  font-size: 3rem;
  font-weight: 700;
  margin: 0;
}

.home-subtitle {
  color: inherit;
  font-size: 1.2rem;
  margin-top: 0.75rem;
}
</style>
