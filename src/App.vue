<script setup>
import { RouterLink, RouterView, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
const auth = useAuthStore();
const route = useRoute();

const navItems = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/users", label: "Users" },
  { to: "/add_user", label: "Add User" },
  { to: "/play", label: "Play Level" },
  { to: "/profile", label: "My Profile" },
];
</script>

<template>
  <!-- TODO: remove the padding for all sites? -->
  <div
    class="min-h-screen text-slate-900"
    :class="route.path === '/editor' ? 'bg-black' : 'bg-sky-100'"
  >
    <main v-if="route.path === '/editor'" class="w-full h-screen">
      <RouterView />
    </main>
    <main v-else class="w-full px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
      <RouterView />
    </main>
  </div>
</template>
