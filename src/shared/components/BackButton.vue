<script setup>
import { useRouter } from "vue-router";
import BackArrow from "@/assets/BackArrow.vue";
import Button from "@/shared/components/Button.vue";

const props = defineProps({
  to: {
    type: String,
    default: "",
  },
});

const router = useRouter();

function goBack() {
  if (props.to) return;
  if (window.history.state?.back) {
    router.back();
  } else {
    router.push("/home");
  }
}
</script>

<template>
  <Button size="rect" :to="to || undefined" @click="goBack">
    <BackArrow />
  </Button>
</template>
