<script setup>
import { onMounted } from "vue";
import { useProfile } from "@/features/profile/composables/useProfile";
import ProfileHeaderPanel from "@/features/profile/components/ProfileHeaderPanel.vue";
import PlayedLevelsPanel from "@/features/profile/components/PlayedLevelsPanel.vue";
import CompletedLevelsPanel from "@/features/profile/components/CompletedLevelsPanel.vue";
import CreatedLevelsPanel from "@/features/profile/components/CreatedLevelsPanel.vue";
import GameBackground from "@/shared/components/GameBackground.vue";
import { gameVisualTokens } from "@/shared/lib/visualizationTokens";
import BackButton from "@/shared/components/BackButton.vue";

const profileTokens = gameVisualTokens;

const {
  username,
  levelsPlayed,
  levelsCompleted,
  createdLevels,
  loading,
  error,
  fetchProfile,
  updateLevelInCache,
} = useProfile();

onMounted(() => {
  fetchProfile();
});
</script>

<template>
  <section class="relative min-h-[calc(100vh-2rem)] w-full overflow-hidden">
    <div class="absolute left-4 top-4 sm:left-10 sm:top-10 z-[100]">
      <BackButton />
    </div>

    <div
      class="relative z-10 min-h-[calc(100vh-2rem)] px-4 py-6 sm:px-6 lg:px-8"
    >
      <div class="mx-auto flex w-full max-w-none flex-col items-center">
        <div class="flex w-full justify-center">
          <div class="w-full max-w-[600px] sm:max-w-[640px] lg:max-w-[720px]">
            <div
              v-if="loading"
              :class="[
                profileTokens.backgrounds.primaryPanel,
                'w-full px-6 py-10',
              ]"
            >
              <p :class="[profileTokens.text.primary, 'text-center text-2xl']">
                Loading profile...
              </p>
            </div>

            <div
              v-else-if="error"
              :class="[
                profileTokens.backgrounds.primaryPanel,
                'w-full px-6 py-10',
              ]"
            >
              <p :class="[profileTokens.text.primary, 'text-center text-2xl']">
                Failed to load profile data.
              </p>
            </div>

            <div v-else class="flex w-full flex-col gap-8 sm:gap-10">
              <ProfileHeaderPanel :username="username" />

              <PlayedLevelsPanel :levels-played="levelsPlayed" />

              <CompletedLevelsPanel :levels-completed="levelsCompleted" />

              <CreatedLevelsPanel
                :created-levels="createdLevels"
                @level-cloned="fetchProfile"
                @level-properties-updated="updateLevelInCache"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
