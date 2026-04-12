<script setup>
import BackArrow from "@/assets/BackArrow.vue";
import Button from "@/shared/components/Button.vue";
const props = defineProps({
  to: {
    type: String,
    default: "/home",
  },
});
</script>

<template>
  <Button size="rect" :to="to">
    <BackArrow />
  </Button>
</template>
