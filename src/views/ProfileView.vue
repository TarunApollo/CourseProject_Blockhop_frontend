<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProfile } from '@/features/profile/composables/useProfile'
import ProfileStats from '@/features/profile/component/ProfileStats.vue'
import CreatedLevelCard from '@/features/profile/component/CreatedLevelCard.vue'
import AppSun from '@/components/AppSun.vue'
import { gameVisualTokens } from '@/shared/lib/visualizationTokens'

const router = useRouter()
const profileTokens = gameVisualTokens

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
  <section
      :class="[profileTokens.backgrounds.sky, 'relative min-h-[calc(100vh-2rem)] w-full overflow-hidden']"
  >
    <div :class="[profileTokens.backgrounds.sky, 'absolute inset-0']"></div>

    <div
        class="absolute inset-x-0 top-0 h-64 bg-repeat-x bg-top"
        :style="{
        backgroundImage: `url('${profileTokens.assets.cloudsBackground}')`,
        backgroundSize: profileTokens.backgroundSize,
      }"
    ></div>

    <div
        class="absolute inset-x-0 bottom-24 h-40 bg-repeat-x bg-bottom opacity-80"
        :style="{
        backgroundImage: `url('${profileTokens.assets.treesBackground}')`,
        backgroundSize: profileTokens.backgroundSize,
      }"
    ></div>

    <div
        class="absolute inset-x-0 bottom-0 h-36 bg-repeat-x bg-bottom"
        :style="{
        backgroundImage: `url('${profileTokens.assets.grassBackground}')`,
        backgroundSize: profileTokens.backgroundSize,
      }"
    ></div>

    <div
        class="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl flex-col px-4 py-4 sm:px-6 sm:py-5 lg:px-8"
    >
      <div class="relative flex min-h-[88px] items-start justify-center sm:min-h-[110px]">
        <button
            type="button"
            :class="[
            profileTokens.backgrounds.backButton,
            profileTokens.backgrounds.backButtonHover,
            'absolute left-0 top-0 flex h-14 w-14 items-center justify-center transition sm:h-16 sm:w-16',
          ]"
            @click="goBack"
        >
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="square" stroke-linejoin="miter" d="M15 6l-6 6 6 6" />
          </svg>
        </button>

        <div class="pt-1 text-center">
          <h1 class="text-[3.1rem] leading-none sm:text-[4.3rem] lg:text-[5rem]">
            <span class="inline-flex items-end whitespace-nowrap">
              <span class="text-white" style="text-shadow: 4px 4px 0 #d9e8ef, 8px 8px 0 rgba(63, 93, 53, 0.9);">
                Block
              </span>
              <span class="-ml-1 text-[#63C85C]" style="text-shadow: 4px 4px 0 #4ca24b, 8px 8px 0 rgba(63, 93, 53, 0.9);">
                hop
              </span>
            </span>
          </h1>
        </div>


        <div class="absolute right-0 top-0">
          <AppSun />
        </div>

      </div>

      <div class="mt-8 text-center sm:mt-10">
        <h2 :class="[profileTokens.text.title, 'text-4xl sm:text-5xl lg:text-6xl']">My Stats</h2>
      </div>

      <div class="mt-8 space-y-6 sm:mt-10">
        <div
            v-if="loading"
            :class="[profileTokens.backgrounds.primaryPanel, 'px-6 py-10']"
        >
          <p :class="[profileTokens.text.primary, 'text-center text-2xl']">Loading profile...</p>
        </div>

        <div
            v-else-if="error"
            :class="[profileTokens.backgrounds.primaryPanel, 'px-6 py-10']"
        >
          <p :class="[profileTokens.text.primary, 'text-center text-2xl']">
            Failed to load profile data.
          </p>
        </div>

        <div v-else class="space-y-6">
          <section :class="[profileTokens.backgrounds.primaryPanel, 'p-5 sm:p-6']">
            <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p :class="[profileTokens.text.accent, 'text-sm uppercase tracking-[0.25em]']">
                  Player
                </p>
                <h3 :class="[profileTokens.text.primary, 'mt-2 break-words text-3xl']">
                  {{ username || 'Blockhop Player' }}
                </h3>
              </div>

              <div :class="[profileTokens.backgrounds.statusBadge, 'px-4 py-2']">
                Ready to hop
              </div>
            </div>

            <div class="mx-auto grid max-w-4xl grid-cols-1 gap-5">
              <ProfileStats label="Levels Played" :value="levelsPlayed" />
              <ProfileStats label="Levels Completed" :value="levelsCompleted" />
            </div>
          </section>

          <section :class="[profileTokens.backgrounds.primaryPanel, 'p-5 sm:p-6']">
            <div class="mb-4">
              <p :class="[profileTokens.text.accent, 'text-sm uppercase tracking-[0.25em]']">
                Workshop
              </p>
              <h3 :class="[profileTokens.text.primary, 'mt-2 text-3xl']">My Created Levels</h3>
            </div>

            <div v-if="createdLevels.length > 0" class="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <CreatedLevelCard v-for="level in createdLevels" :key="level.id" :level="level" />
            </div>

            <div
                v-else
                :class="[profileTokens.backgrounds.emptyPanel, 'min-h-[220px]']"
            ></div>
          </section>
        </div>
      </div>
    </div>
  </section>
</template>
