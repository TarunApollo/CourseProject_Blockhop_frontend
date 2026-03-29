<script setup>
import { onMounted } from 'vue'
import { useProfile } from '@/features/profile/composables/useProfile'
import ProfileHeaderPanel from '@/features/profile/component/ProfileHeaderPanel.vue'
import PlayedLevelsPanel from '@/features/profile/component/PlayedLevelsPanel.vue'
import CompletedLevelsPanel from '@/features/profile/component/CompletedLevelsPanel.vue'
import CreatedLevelCard from '@/features/profile/component/CreatedLevelCard.vue'
import BackButton from '@/components/BackButton.vue'
import Sun from '@/components/Sun.vue'
import BlockhopWordmark from '@/components/BlockhopWordmark.vue'
import { gameVisualTokens } from '@/shared/lib/visualizationTokens'

const profileTokens = gameVisualTokens

const { username, levelsPlayed, levelsCompleted, createdLevels, loading, error, fetchProfile } =
    useProfile()

onMounted(() => {
  fetchProfile()
})
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

    <div class="absolute left-4 top-4 z-20 sm:left-6 sm:top-5">
      <BackButton />
    </div>

    <div class="absolute right-4 top-4 z-20 sm:right-6 sm:top-5">
      <Sun />
    </div>

    <div class="relative z-10 min-h-[calc(100vh-2rem)] px-4 py-6 sm:px-6 lg:px-8">
      <div class="mx-auto flex w-full max-w-none flex-col items-center">
        <div class="pt-4 text-center sm:pt-2">
          <BlockhopWordmark />
        </div>


        <div class="mt-10 flex w-full justify-center sm:mt-14">
          <div class="w-full max-w-[600px] space-y-6 sm:max-w-[640px] lg:max-w-[720px]">
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

            <div v-else class="w-full space-y-6">
              <ProfileHeaderPanel :username="username" />

              <div class="w-full space-y-5">
                <div class="w-full">
                  <PlayedLevelsPanel :levels-played="levelsPlayed" />
                </div>

                <div class="w-full">
                  <CompletedLevelsPanel :levels-completed="levelsCompleted" />
                </div>
              </div>

              <section :class="[profileTokens.backgrounds.primaryPanel, 'w-full p-5 sm:p-6']">
                <div class="mb-4">
                  <p :class="[profileTokens.text.accent, 'text-sm uppercase tracking-[0.25em]']">
                    Workshop
                  </p>
                  <h2 :class="[profileTokens.text.primary, 'mt-2 text-3xl']">My Created Levels</h2>
                </div>

                <div v-if="createdLevels.length > 0" class="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <CreatedLevelCard v-for="level in createdLevels" :key="level.id" :level="level" />
                </div>

                <div
                    v-else
                    :class="[profileTokens.backgrounds.emptyPanel, 'min-h-[220px] w-full']"
                ></div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>

  </section>
</template>
