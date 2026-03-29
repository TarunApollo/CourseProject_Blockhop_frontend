<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProfile } from '@/features/profile/composables/useProfile'
import ProfileStats from '@/features/profile/component/ProfileStats.vue'
import CreatedLevelCard from '@/features/profile/component/CreatedLevelCard.vue'
import { profileVisualTokens } from '@/features/profile/lib/visualizationTokens'

const router = useRouter()
const profileTokens = profileVisualTokens

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
        class="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col px-2 py-3 sm:px-4 sm:py-4 lg:px-6"
    >
      <div class="grid grid-cols-[auto_1fr_auto] items-start gap-3 sm:gap-4">
        <button
            type="button"
            :class="[
            profileTokens.backgrounds.backButton,
            profileTokens.backgrounds.backButtonHover,
            'flex h-14 w-14 items-center justify-center transition',
          ]"
            @click="goBack"
        >
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="square" stroke-linejoin="miter" d="M15 6l-6 6 6 6" />
          </svg>
        </button>

        <div class="flex justify-center pt-1">
          <img
              :src="profileTokens.assets.logo"
              alt="Blockhop"
              class="h-auto w-[220px] max-w-full sm:w-[280px] lg:w-[360px]"
          >
        </div>

        <div class="relative mt-1 h-14 w-14 justify-self-end sm:h-16 sm:w-16">
          <div :class="[profileTokens.backgrounds.sun, 'absolute inset-0 rounded-full']"></div>
          <span :class="[profileTokens.backgrounds.sun, 'absolute left-1/2 top-[-6px] h-3 w-1 -translate-x-1/2']"></span>
          <span :class="[profileTokens.backgrounds.sun, 'absolute bottom-[-6px] left-1/2 h-3 w-1 -translate-x-1/2']"></span>
          <span :class="[profileTokens.backgrounds.sun, 'absolute left-[-6px] top-1/2 h-1 w-3 -translate-y-1/2']"></span>
          <span :class="[profileTokens.backgrounds.sun, 'absolute right-[-6px] top-1/2 h-1 w-3 -translate-y-1/2']"></span>
          <span :class="[profileTokens.backgrounds.sun, 'absolute left-[6px] top-[2px] h-1 w-3 -rotate-45']"></span>
          <span :class="[profileTokens.backgrounds.sun, 'absolute right-[6px] top-[2px] h-1 w-3 rotate-45']"></span>
          <span :class="[profileTokens.backgrounds.sun, 'absolute bottom-[2px] left-[6px] h-1 w-3 rotate-45']"></span>
          <span :class="[profileTokens.backgrounds.sun, 'absolute bottom-[2px] right-[6px] h-1 w-3 -rotate-45']"></span>
        </div>
      </div>

      <div class="mt-10 text-center sm:mt-12">
        <h1 :class="[profileTokens.text.title, 'text-4xl sm:text-5xl lg:text-6xl']">My Stats</h1>
        <p
            :class="[profileTokens.text.secondary, 'mx-auto mt-6 max-w-3xl text-xl leading-relaxed sm:text-2xl']"
        >
          Here you can view your game statistics and achievements.
        </p>
      </div>

      <div class="mt-10 space-y-6 sm:mt-12">
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
            <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p :class="[profileTokens.text.accent, 'text-sm uppercase tracking-[0.25em]']">
                  Player
                </p>
                <h2 :class="[profileTokens.text.primary, 'mt-2 break-words text-3xl']">
                  {{ username || 'Blockhop Player' }}
                </h2>
              </div>

              <div :class="[profileTokens.backgrounds.statusBadge, 'px-4 py-2']">
                Ready to hop
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ProfileStats label="Levels Played" :value="levelsPlayed" />
              <ProfileStats label="Levels Completed" :value="levelsCompleted" />
            </div>
          </section>

          <section :class="[profileTokens.backgrounds.primaryPanel, 'p-5 sm:p-6']">
            <div class="mb-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p :class="[profileTokens.text.accent, 'text-sm uppercase tracking-[0.25em]']">
                  Workshop
                </p>
                <h2 :class="[profileTokens.text.primary, 'mt-2 text-3xl']">My Created Levels</h2>
              </div>
              <p :class="[profileTokens.text.primary, 'text-base']">
                Published and unpublished levels appear here.
              </p>
            </div>

            <div v-if="createdLevels.length > 0" class="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <CreatedLevelCard v-for="level in createdLevels" :key="level.id" :level="level" />
            </div>

            <div
                v-else
                :class="[profileTokens.backgrounds.emptyPanel, 'px-4 py-12 text-center']"
            >
              <p :class="[profileTokens.text.accent, 'text-sm uppercase tracking-[0.22em]']">
                No levels yet
              </p>
              <h3 :class="[profileTokens.text.primary, 'mt-3 text-3xl']">
                Your workshop is empty
              </h3>
              <p :class="[profileTokens.text.secondary, 'mt-2 text-base']">
                Once you create levels, they will appear here.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  </section>
</template>
