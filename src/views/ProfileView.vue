<script setup>
import { onMounted } from 'vue'
import { useProfile } from '@/features/profile/composables/useProfile'
import ProfileHeaderPanel from '@/features/profile/component/ProfileHeaderPanel.vue'
import PlayedLevelsPanel from '@/features/profile/component/PlayedLevelsPanel.vue'
import CompletedLevelsPanel from '@/features/profile/component/CompletedLevelsPanel.vue'
import CreatedLevelsPanel from '@/features/profile/component/CreatedLevelsPanel.vue'
import BackButton from '@/components/BackButton.vue'
import Sun from '@/components/Sun.vue'
import GameBackground from '@/components/GameBackground.vue'
import { gameVisualTokens } from '@/shared/lib/visualizationTokens'
import BlockhopTitle from "@/shared/components/BlockhopTitle.vue";

const profileTokens = gameVisualTokens

const { username, levelsPlayed, levelsCompleted, createdLevels, loading, error, fetchProfile } =
    useProfile()

onMounted(() => {
  fetchProfile()
})
</script>


<template>
  <section :class="[profileTokens.backgrounds.sky, 'relative min-h-[calc(100vh-2rem)] w-full overflow-hidden']">
    <GameBackground />

    <div class="absolute left-4 top-4 z-20 sm:left-6 sm:top-5">
      <BackButton />
    </div>

    <div class="absolute right-4 top-4 z-20 sm:right-6 sm:top-5">
      <Sun />
    </div>

    <div class="relative z-10 min-h-[calc(100vh-2rem)] px-4 py-6 sm:px-6 lg:px-8">
      <div class="mx-auto flex w-full max-w-none flex-col items-center">
        <div class="pb-8 pt-4 text-center sm:pb-12 sm:pt-2 lg:pb-16">
          <BlockhopTitle />
        </div>

        <div class="flex w-full justify-center">

          <div class="w-full max-w-[600px] sm:max-w-[640px] lg:max-w-[720px]">
            <div
                v-if="loading"
                :class="[profileTokens.backgrounds.primaryPanel, 'w-full px-6 py-10']"
            >
              <p :class="[profileTokens.text.primary, 'text-center text-2xl']">Loading profile...</p>
            </div>

            <div
                v-else-if="error"
                :class="[profileTokens.backgrounds.primaryPanel, 'w-full px-6 py-10']"
            >
              <p :class="[profileTokens.text.primary, 'text-center text-2xl']">
                Failed to load profile data.
              </p>
            </div>

            <div v-else class="flex w-full flex-col gap-8 sm:gap-10">
              <ProfileHeaderPanel :username="username" />

              <PlayedLevelsPanel :levels-played="levelsPlayed" />

              <CompletedLevelsPanel :levels-completed="levelsCompleted" />

              <CreatedLevelsPanel :created-levels="createdLevels" />
            </div>

          </div>
        </div>

      </div>
    </div>

  </section>
</template>
