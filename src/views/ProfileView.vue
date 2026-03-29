<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProfile } from '@/features/profile/composables/useProfile'
import ProfileStats from '@/features/profile/component/ProfileStats.vue'
import CreatedLevelCard from '@/features/profile/component/CreatedLevelCard.vue'

const router = useRouter()

const { username, levelsPlayed, levelsCompleted, createdLevels, loading, error, fetchProfile } =
    useProfile()

onMounted(() => {
  fetchProfile()
})

function goBack() {
  router.back()
}
</script>

<template>
  <section class="relative min-h-[calc(100vh-2rem)] w-full overflow-hidden bg-sky-200">
    <div class="absolute inset-0 bg-sky-200"></div>

    <div
        class="absolute inset-x-0 top-0 h-64 bg-repeat-x bg-top"
        style="background-image: url('/assets/background/overworld/background_clouds.png'); background-size: 320px auto;"
    ></div>

    <div
        class="absolute inset-x-0 bottom-24 h-40 bg-repeat-x bg-bottom opacity-80"
        style="background-image: url('/assets/background/overworld/background_color_trees.png'); background-size: 320px auto;"
    ></div>

    <div
        class="absolute inset-x-0 bottom-0 h-36 bg-repeat-x bg-bottom"
        style="background-image: url('/assets/background/overworld/background_solid_grass.png'); background-size: 320px auto;"
    ></div>

    <div class="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col px-2 py-3 sm:px-4 sm:py-4 lg:px-6">
      <div class="grid grid-cols-[auto_1fr_auto] items-start gap-3 sm:gap-4">
        <button
            type="button"
            class="flex h-14 w-14 items-center justify-center border-2 border-emerald-900/40 bg-[#7BE089] text-slate-900 shadow-[0_4px_0_rgba(20,83,45,0.35)] transition hover:translate-y-[1px] hover:shadow-[0_2px_0_rgba(20,83,45,0.35)]"
            @click="goBack"
        >
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="square" stroke-linejoin="miter" d="M15 6l-6 6 6 6" />
          </svg>
        </button>

        <div class="flex justify-center pt-1">
          <img
              src="/assets/logo.png"
              alt="Blockhop"
              class="h-auto w-[220px] max-w-full sm:w-[280px] lg:w-[360px]"
          >
        </div>

        <div class="relative mt-1 h-14 w-14 justify-self-end sm:h-16 sm:w-16">
          <div class="absolute inset-0 rounded-full bg-[#FFE97A]"></div>
          <span class="absolute left-1/2 top-[-6px] h-3 w-1 -translate-x-1/2 bg-[#FFE97A]"></span>
          <span class="absolute bottom-[-6px] left-1/2 h-3 w-1 -translate-x-1/2 bg-[#FFE97A]"></span>
          <span class="absolute left-[-6px] top-1/2 h-1 w-3 -translate-y-1/2 bg-[#FFE97A]"></span>
          <span class="absolute right-[-6px] top-1/2 h-1 w-3 -translate-y-1/2 bg-[#FFE97A]"></span>
          <span class="absolute left-[6px] top-[2px] h-1 w-3 -rotate-45 bg-[#FFE97A]"></span>
          <span class="absolute right-[6px] top-[2px] h-1 w-3 rotate-45 bg-[#FFE97A]"></span>
          <span class="absolute bottom-[2px] left-[6px] h-1 w-3 rotate-45 bg-[#FFE97A]"></span>
          <span class="absolute bottom-[2px] right-[6px] h-1 w-3 -rotate-45 bg-[#FFE97A]"></span>
        </div>
      </div>

      <div class="mt-10 text-center sm:mt-12">
        <h1 class="text-4xl text-[#294E1F] sm:text-5xl lg:text-6xl">My Stats</h1>
        <p class="mx-auto mt-6 max-w-3xl text-xl leading-relaxed text-[#2E4C24] sm:text-2xl">
          Here you can view your game statistics and achievements.
        </p>
      </div>

      <div class="mt-10 space-y-6 sm:mt-12">
        <div
            v-if="loading"
            class="border-2 border-[#4A6A46] bg-[#8AE38D] px-6 py-10 shadow-[0_5px_0_rgba(36,61,29,0.35)]"
        >
          <p class="text-center text-2xl text-[#1F3B17]">Loading profile...</p>
        </div>

        <div
            v-else-if="error"
            class="border-2 border-[#4A6A46] bg-[#8AE38D] px-6 py-10 shadow-[0_5px_0_rgba(36,61,29,0.35)]"
        >
          <p class="text-center text-2xl text-[#1F3B17]">Failed to load profile data.</p>
        </div>

        <div v-else class="space-y-6">
          <section class="border-2 border-[#4A6A46] bg-[#8AE38D] p-5 shadow-[0_5px_0_rgba(36,61,29,0.35)] sm:p-6">
            <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="text-sm uppercase tracking-[0.25em] text-[#2F5A28]">Player</p>
                <h2 class="mt-2 text-3xl text-[#1F3B17] break-words">
                  {{ username || 'Blockhop Player' }}
                </h2>
              </div>

              <div class="border-2 border-[#D8C451] bg-[#FFF2A6] px-4 py-2 text-[#7A5A17]">
                Ready to hop
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ProfileStats label="Levels Played" :value="levelsPlayed" />
              <ProfileStats label="Levels Completed" :value="levelsCompleted" />
            </div>
          </section>

          <section class="border-2 border-[#4A6A46] bg-[#8AE38D] p-5 shadow-[0_5px_0_rgba(36,61,29,0.35)] sm:p-6">
            <div class="mb-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p class="text-sm uppercase tracking-[0.25em] text-[#2F5A28]">Workshop</p>
                <h2 class="mt-2 text-3xl text-[#1F3B17]">My Created Levels</h2>
              </div>
              <p class="text-base text-[#1F3B17]">Published and unpublished levels appear here.</p>
            </div>

            <div v-if="createdLevels.length > 0" class="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <CreatedLevelCard v-for="level in createdLevels" :key="level.id" :level="level" />
            </div>

            <div
                v-else
                class="border-2 border-dashed border-[#4A6A46] bg-[#9BEA9A] px-4 py-12 text-center"
            >
              <p class="text-sm uppercase tracking-[0.22em] text-[#2F5A28]">No levels yet</p>
              <h3 class="mt-3 text-3xl text-[#1F3B17]">Your workshop is empty</h3>
              <p class="mt-2 text-base text-[#2E4C24]">
                Once you create levels, they will appear here.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  </section>
</template>
