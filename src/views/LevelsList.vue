<script setup>
import AvailableLevels from '@/features/available-levels/component/availableLevels.vue';
import BackButton from '@/shared/components/BackButton.vue';
import GameBackground from '@/shared/components/GameBackground.vue';




</script>


<template>
    <GameBackground />
    <div class="absolute left-4 top-4 sm:left-10 sm:top-10 z-[100]">
      <BackButton />
    </div>

    <div
      class="relative z-10 min-h-[calc(100vh-2rem)] px-4 py-6 sm:px-6 lg:px-8"
    >
      <div class="mx-auto flex w-full max-w-none flex-col items-center">
        <div class="flex w-full justify-center">
          <div class="w-full max-w-[800px] sm:max-w-[840px] lg:max-w-[920px]"> <!--  Here we change width  -->
            <div
              v-if="loading"
              :class="[
                profileTokens.backgrounds.primaryPanel,
                'w-full px-6 py-10',
              ]"
            >
              <p :class="[profileTokens.text.primary, 'text-center text-2xl']">
                Loading level list...
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
                Failed to load the level list.
              </p>
            </div>

            <div v-else
                class="flex w-full flex-col gap-80 sm:gap-80"
                >
                <!-- Here! -->
                <AvailableLevels/>
            </div>
          </div>
        </div>
      </div>
    </div>


</template>
