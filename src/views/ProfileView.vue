<script setup>
import { onMounted } from 'vue'
import { useProfile } from '@/features/profile/composables/useProfile'
import ProfileStats from '@/features/profile/component/ProfileStats.vue'
import CreatedLevelCard from '@/features/profile/component/CreatedLevelCard.vue'

const { username, levelsPlayed, levelsCompleted, createdLevels, loading, error, fetchProfile } = useProfile()

onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <main class="max-w-3xl mx-auto px-4 py-8">

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-12 text-gray-500 text-lg">
      Loading profile…
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-center py-12 text-red-600 text-lg">
      {{ error }}
    </div>

    <!-- Profile content -->
    <div v-else>

      <!-- Profile header -->
      <section class="flex items-center gap-5 mb-10">
        <div class="w-[72px] h-[72px] rounded-full bg-blue-500 text-white flex items-center justify-center text-3xl font-bold shrink-0">
          {{ username ? username.charAt(0).toUpperCase() : '?' }}
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 m-0">{{ username }}</h1>
          <p class="text-gray-500 text-sm mt-1">Blockhop Player</p>
        </div>
      </section>

      <!-- Stats summary -->
      <section class="mb-10">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Your Stats</h2>
        <div class="flex gap-4 flex-wrap">
          <ProfileStats
              label="Levels Played"
              :value="levelsPlayed"
              icon="🎮"
          />
          <ProfileStats
              label="Levels Completed"
              :value="levelsCompleted"
              icon="✅"
          />
        </div>
      </section>

      <!-- Created Levels section -->
      <section class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">My Created Levels</h2>

        <!-- Levels grid (when levels exist) -->
        <div v-if="createdLevels.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CreatedLevelCard
              v-for="level in createdLevels"
              :key="level.id"
              :level="level"
          />
        </div>

        <!-- Empty state (when no levels exist) -->
        <div v-else class="border-2 border-dashed border-gray-300 rounded-xl py-12 px-4 text-center text-gray-400">
          <p>You haven't created any levels yet.</p>
        </div>
      </section>

    </div>
  </main>
</template>