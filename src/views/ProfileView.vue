<script setup>
import { onMounted } from 'vue'
import { useProfile } from '@/features/profile/composables/useProfile'
import ProfileStats from '@/features/profile/component/ProfileStats.vue'
import CreatedLevelCard from '@/features/profile/component/CreatedLevelCard.vue'

const { username, levelsPlayed, levelsCompleted, createdLevels, loading, error, fetchProfile } =
    useProfile()

onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <section
      class="relative overflow-hidden rounded-[2rem] border-4 border-slate-900/20 bg-sky-200 shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
  >
    <div class="absolute inset-0 bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-100"></div>

    <div
        class="absolute inset-x-0 top-0 h-64 bg-repeat-x bg-top opacity-80"
        style="background-image: url('/assets/background/overworld/background_clouds.png'); background-size: 320px auto;"
    ></div>

    <div
        class="absolute inset-x-0 bottom-24 h-44 bg-repeat-x bg-bottom opacity-70"
        style="background-image: url('/assets/background/overworld/background_color_trees.png'); background-size: 320px auto;"
    ></div>

    <div
        class="absolute inset-x-0 bottom-0 h-36 bg-repeat-x bg-bottom"
        style="background-image: url('/assets/background/overworld/background_solid_grass.png'); background-size: 320px auto;"
    ></div>

    <div class="relative z-10 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div
          class="mb-8 flex flex-col gap-6 rounded-[2rem] border-4 border-slate-900/15 bg-white/72 p-6 backdrop-blur-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between"
      >
        <div class="flex items-center gap-5">
          <div
              class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-slate-900/15 bg-emerald-400 text-4xl text-white shadow-[0_8px_0_rgba(20,83,45,0.25)]"
          >
            {{ username ? username.charAt(0).toUpperCase() : '?' }}
          </div>

          <div>
            <p class="text-sm uppercase tracking-[0.25em] text-emerald-700">Player Profile</p>
            <h1 class="text-3xl text-slate-900 sm:text-4xl">
              {{ username || 'Blockhop Player' }}
            </h1>
            <p class="mt-2 max-w-xl text-sm text-slate-600 sm:text-base">
              Check your progress, celebrate completed adventures, and manage the levels you have
              created.
            </p>
          </div>
        </div>

        <div
            class="self-start rounded-2xl border-4 border-yellow-200 bg-yellow-100 px-4 py-3 text-sm text-yellow-900 shadow-[0_6px_0_rgba(202,138,4,0.18)]"
        >
          <span class="block uppercase tracking-[0.2em] text-yellow-700">Status</span>
          <span class="text-lg">Ready to hop</span>
        </div>
      </div>

      <div
          v-if="loading"
          class="rounded-[2rem] border-4 border-sky-200 bg-white/85 px-6 py-14 text-center backdrop-blur-sm"
      >
        <p class="text-sm uppercase tracking-[0.25em] text-sky-700">Loading</p>
        <h2 class="mt-3 text-2xl text-slate-900">Preparing your profile...</h2>
        <p class="mt-2 text-sm text-slate-600">Fetching stats and created levels.</p>
      </div>

      <div
          v-else-if="error"
          class="rounded-[2rem] border-4 border-red-200 bg-red-50/90 px-6 py-14 text-center backdrop-blur-sm"
      >
        <p class="text-sm uppercase tracking-[0.25em] text-red-600">Profile unavailable</p>
        <h2 class="mt-3 text-2xl text-red-700">Failed to load profile data.</h2>
        <p class="mx-auto mt-2 max-w-2xl text-sm text-red-600">
          Make sure the backend is running and that you already opened the authenticated backend URL
          in the browser.
        </p>

        <button
            type="button"
            class="mt-6 rounded-full border-2 border-red-300 bg-white px-5 py-2 text-sm text-red-700 transition hover:bg-red-100"
            @click="fetchProfile"
        >
          Try Again
        </button>
      </div>

      <div v-else class="space-y-8">
        <section
            class="rounded-[2rem] border-4 border-slate-900/15 bg-white/72 p-6 backdrop-blur-sm sm:p-8"
        >
          <div class="mb-5 flex items-center justify-between gap-3">
            <div>
              <p class="text-sm uppercase tracking-[0.25em] text-emerald-700">Overview</p>
              <h2 class="text-2xl text-slate-900">Your Stats</h2>
            </div>
            <div class="hidden rounded-2xl bg-sky-100 px-4 py-2 text-sm text-sky-800 sm:block">
              Keep going
            </div>
          </div>

          <div class="flex flex-wrap gap-4">
            <ProfileStats label="Levels Played" :value="levelsPlayed" icon="🎮" />
            <ProfileStats label="Levels Completed" :value="levelsCompleted" icon="✅" />
          </div>
        </section>

        <section
            class="rounded-[2rem] border-4 border-slate-900/15 bg-white/72 p-6 backdrop-blur-sm sm:p-8"
        >
          <div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-sm uppercase tracking-[0.25em] text-emerald-700">Workshop</p>
              <h2 class="text-2xl text-slate-900">My Created Levels</h2>
            </div>
            <p class="text-sm text-slate-600">Published and unpublished levels appear here.</p>
          </div>

          <div v-if="createdLevels.length > 0" class="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <CreatedLevelCard v-for="level in createdLevels" :key="level.id" :level="level" />
          </div>

          <div
              v-else
              class="rounded-[1.5rem] border-4 border-dashed border-slate-300 bg-slate-50/80 px-4 py-12 text-center"
          >
            <p class="text-sm uppercase tracking-[0.22em] text-slate-400">No levels yet</p>
            <h3 class="mt-3 text-2xl text-slate-700">Your workshop is empty</h3>
            <p class="mt-2 text-sm text-slate-500">
              Once you create levels, they will appear here.
            </p>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>
