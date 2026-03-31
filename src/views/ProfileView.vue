<script setup>
import { onMounted } from 'vue'
import { useProfile } from '@/features/profile/composables/useProfile'
import ProfileHeaderPanel from '@/features/profile/component/ProfileHeaderPanel.vue'
import PlayedLevelsPanel from '@/features/profile/component/PlayedLevelsPanel.vue'
import CompletedLevelsPanel from '@/features/profile/component/CompletedLevelsPanel.vue'
import CreatedLevelsPanel from '@/features/profile/component/CreatedLevelsPanel.vue'
import ReturnButton from '@/shared/components/ReturnButton.vue'
import MainLogo from '@/shared/components/MainLogo.vue'
import { gameVisualTokens } from '@/shared/lib/visualizationTokens'

const profileTokens = gameVisualTokens

const { username, levelsPlayed, levelsCompleted, createdLevels, loading, error, fetchProfile } =
    useProfile()

onMounted(() => {
  fetchProfile()
})
</script>


<template>
    <ReturnButton />

    <div class="relative flex min-h-screen flex-col">
      <MainLogo />

      <div class="flex flex-1 justify-center px-4 pb-6 sm:px-6 lg:px-8">
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
</template>
