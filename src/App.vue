<script setup>
import { RouterLink, RouterView } from 'vue-router'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/users', label: 'Users' },
  { to: '/add_user', label: 'Add User' },
  { to: '/play', label: 'Play Level' },
  { to: '/profile', label: 'My Profile' },
]
</script>

<template>
  <div class="min-h-screen bg-sky-100 text-slate-900">
    <header class="border-b border-slate-900/10 bg-white/80 backdrop-blur-sm">
      <div
          class="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <RouterLink to="/" class="shrink-0">
          <img
              src="/assets/logo.png"
              alt="Blockhop"
              class="h-10 w-auto sm:h-12"
          >
        </RouterLink>

        <nav class="flex flex-wrap gap-2">
          <RouterLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm text-slate-700 transition hover:-translate-y-0.5 hover:bg-emerald-100 hover:text-emerald-800"
              active-class="bg-emerald-200 text-emerald-900"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="mx-auto w-full max-w-7xl px-4 py-6">
      <RouterView />
    </main>
  </div>
</template>
