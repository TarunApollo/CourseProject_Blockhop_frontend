<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push("/home");
  }
};
</script>

<template>
  <div class="ui-panel absolute left-10 top-10 z-10 p-2!">
    <button
      class="ui-btn p-2! flex items-center justify-center"
      type="button"
      @click="goBack"
    >
      <svg
        class="w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z"
          fill="currentColor"
        />
      </svg>
    </button>
  </div>
</template>
