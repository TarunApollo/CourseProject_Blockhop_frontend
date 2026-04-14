<script setup>
import { ref } from 'vue'
import { gameVisualTokens } from '@/shared/lib/visualizationTokens'
import CreatedLevelCard from '@/features/profile/components/CreatedLevelCard.vue'
import CreateLevelForm from '@/features/level-creation/components/CreateLevelForm.vue'

const props = defineProps({
  createdLevels: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['levelCloned', 'levelPropertiesUpdated'])

const profileTokens = gameVisualTokens
const showCreateModal = ref(false)

function onLevelCreated() {
  showCreateModal.value = false
  emit('levelCloned')
}
</script>

<template>
  <section :class="[profileTokens.backgrounds.primaryPanel, 'w-full p-5 sm:p-6']">
    <div class="mb-4">
      <p :class="[profileTokens.text.accent, 'text-sm uppercase tracking-[0.25em]']">
        Workshop
      </p>
      <h2 :class="[profileTokens.text.primary, 'mt-2 text-3xl']">My Created Levels</h2>
    </div>

    <button
      type="button"
      :class="[profileTokens.backgrounds.emptyPanel, 'mb-4 w-full flex items-center justify-center gap-3 px-4 py-5 cursor-pointer transition-colors hover:bg-[#A8E892]']"
      @click="showCreateModal = true"
    >
      <span :class="[profileTokens.text.primary, 'text-2xl font-bold leading-none']">+</span>
      <span :class="[profileTokens.text.primary, 'text-base font-bold uppercase tracking-[0.15em]']">New Level</span>
    </button>

    <Teleport to="body">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @mousedown.self="showCreateModal = false"
      >
        <CreateLevelForm @created="onLevelCreated" />
      </div>
    </Teleport>

    <div v-if="createdLevels.length > 0" class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <CreatedLevelCard
          v-for="level in createdLevels"
          :key="level.id"
          :level="level"
          @cloned="emit('levelCloned')"
          @properties-updated="emit('levelPropertiesUpdated', $event)"
      />
    </div>
    <div
      v-else
      :class="[profileTokens.backgrounds.emptyPanel, 'min-h-[220px] w-full flex items-center justify-center px-4']"
    >
      <p :class="[profileTokens.text.secondary, 'text-center text-base']">
        No created levels yet.
      </p>
    </div>
  </section>
</template>
