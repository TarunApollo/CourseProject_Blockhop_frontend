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
  >
    <main class="w-full h-screen">
      <RouterView />
    </main>
  </div>
</template>
