<template>
  <div class="menu-grid">
    <RouterLink to="/profile" class="menu-ui-button menu-button">Profile</RouterLink>
    <RouterLink to="/level-list" class="menu-ui-button menu-button">Levels</RouterLink>
    <RouterLink to="/play" class="menu-ui-button menu-button">Play Level</RouterLink>
    <RouterLink to="/about" class="menu-ui-button menu-button">About</RouterLink>
    </div>
</template>

<style scoped>
.menu-grid {
  position: absolute;
  left: 50%;
  top: 55%;
  display: grid;
  width: min(450px, 90vw);
  transform: translate(-50%, -50%);
  grid-template-columns: repeat(1, minmax(100px, 1fr));
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  pointer-events: all;
}

.menu-ui-button {
    cursor: pointer;
    white-space: nowrap;
    border-width: 1px;
    border-style: solid;
    background-color: var(--color-game-primary);
    text-align: center;
    font-family: var(--font-game);
    font-weight: 700;
    box-shadow: var(--shadow-game-raised);
    transition:
        transform 75ms ease,
        background-color 75ms ease;
    border-color: var(--color-ink-strong);
    color: var(--color-ink-strong);

    &:hover {
        transform: translateY(-0.125rem);
        background-color: var(--color-game-primary-hover);
    }

    &:active {
        transform: translateY(0);
    }
}

.menu-button {
  display: block;
  padding-inline: clamp(15px, 5vw, 15px);
  padding-block: clamp(8px, 2vw, 8px);
  font-size: clamp(0.2rem, 2.3vw, 4rem);
  color: var(--color-ink-strong);
}

@media (max-width: 768px) {
  .menu-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .menu-grid {
    grid-template-columns: 1fr;
  }
}
</style>