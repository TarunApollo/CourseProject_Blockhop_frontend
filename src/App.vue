<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
const route = useRoute()

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
    <header
        v-if="route.path !== '/profile'"
        class="sticky top-0 z-30 border-b-4 border-slate-900/10 bg-white/80 backdrop-blur-md"
    >
      <div
          class="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between lg:px-6"
      >
        <RouterLink
            to="/"
            class="flex items-center gap-3 self-start rounded-[1.25rem] border-4 border-slate-900/10 bg-white/90 px-3 py-2 shadow-[0_6px_0_rgba(148,163,184,0.14)] transition hover:-translate-y-0.5"
        >
          <span
              class="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-sky-400 text-2xl text-white shadow-[0_4px_0_rgba(21,128,61,0.22)]"
          >
            B
          </span>

          <div>
            <p class="text-[0.65rem] uppercase tracking-[0.28em] text-emerald-700">Arcade Hub</p>
            <p class="text-2xl leading-none text-slate-900 sm:text-3xl">Blockhop</p>
          </div>
        </RouterLink>

        <nav v-if="auth.isAuthenticated" class="flex flex-wrap gap-2 lg:justify-end">
          <RouterLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="rounded-full border-2 border-slate-900/10 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
              active-class="border-emerald-300 bg-emerald-100 text-emerald-900 shadow-[0_4px_0_rgba(16,185,129,0.18)]"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </div>
    </header>
>>>>>>> dev

    <main class="w-full px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
      <RouterView />
    </main>
  </div>
</template>
