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
  <section class="relative overflow-hidden rounded-[2rem] border-4 border-slate-900/20 bg-sky-200 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
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
      <div class="mb-8 flex flex-col gap-6 rounded-[2rem] border-4 border-slate-900/15 bg-white/72 p-6 backdrop-blur-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-center gap-5">
          <div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-slate-900/15 bg-emerald-400 text-4xl text-white shadow-[0_8px_0_rgba(20,83,45,0.25)]">
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

        <div class="self-start rounded-2xl border-4 border-yellow-200 bg-yellow-100 px-4 py-3 text-sm text-yellow-900 shadow-[0_6px_0_rgba(202,138,4,0.18)]">
          <span class="block uppercase tracking-[0.2em] text-yellow-700">Status</span>
          <span class="text-lg">Ready to hop</span>
        </div>
      </div>

      <div
          v-if="loading"
          class="relative rounded-[2rem] border-4 border-slate-900/15 bg-white/80 px-6 py-16 text-center text-lg text-slate-600 backdrop-blur-sm"
      >
        Loading profile...
      </div>

      <div
          v-else-if="error"
          class="relative rounded-[2rem] border-4 border-red-200 bg-red-50/90 px-6 py-16 text-center text-lg text-red-700 backdrop-blur-sm"
      >
        {{ error }}
      </div>

      <div v-else class="space-y-8">
        <section class="rounded-[2rem] border-4 border-slate-900/15 bg-white/72 p-6 backdrop-blur-sm sm:p-8">
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

        <section class="rounded-[2rem] border-4 border-slate-900/15 bg-white/72 p-6 backdrop-blur-sm sm:p-8">
          <div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-sm uppercase tracking-[0.25em] text-emerald-700">Workshop</p>
              <h2 class="text-2xl text-slate-900">My Created Levels</h2>
            </div>
            <p class="text-sm text-slate-600">
              Published and unpublished levels appear here.
            </p>
          </div>

          <div v-if="createdLevels.length > 0" class="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <CreatedLevelCard
                v-for="level in createdLevels"
                :key="level.id"
                :level="level"
            />
          </div>

          <div
              v-else
              class="rounded-[1.5rem] border-4 border-dashed border-slate-300 bg-slate-50/80 px-4 py-12 text-center text-slate-500"
          >
            You haven't created any levels yet.
          </div>
        </section>
      </div>
    </div>
  </section>
</template>
