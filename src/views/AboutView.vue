<script setup>
import BackButton from "@/shared/components/BackButton.vue";
import { gameVisualTokens } from "@/shared/lib/visualizationTokens";

const tokens = gameVisualTokens;
</script>

<template>
  <section class="relative min-h-[calc(100vh-2rem)] w-full overflow-hidden">
    <div class="fixed left-4 top-4 sm:left-10 sm:top-10 z-[100]">
      <BackButton to="/home" />
    </div>

    <div
      class="relative z-10 min-h-[calc(100vh-2rem)] px-4 py-6 sm:px-6 lg:px-8"
    >
      <div class="mx-auto flex w-full max-w-none flex-col items-center">
        <div class="w-full max-w-[600px] sm:max-w-[640px] lg:max-w-[720px] flex flex-col gap-8 sm:gap-10">
          <section :class="[tokens.backgrounds.primaryPanel, 'w-full p-5 sm:p-6']">
            <p :class="[tokens.text.accent, 'text-sm uppercase tracking-[0.25em]']">
              Welcome
            </p>
            <h2 :class="[tokens.text.primary, 'mt-2 text-3xl']">
              About Blockhop
            </h2>
            <p :class="[tokens.text.primary, 'mt-4 leading-relaxed']">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
              in reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur.
            </p>
          </section>

          <section :class="[tokens.backgrounds.secondaryPanel, 'w-full p-5']">
            <p :class="[tokens.text.accent, 'text-sm uppercase tracking-[0.22em]']">
              How It Works
            </p>
            <p :class="[tokens.text.primary, 'mt-4 leading-relaxed']">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
              scelerisque leo nec nisl fermentum, vel cursus felis posuere.
              Vivamus lacinia odio vitae vestibulum vestibulum. Cras porttitor
              metus justo, ut fringilla velit fermentum a. Praesent vel
              elementum velit. Pellentesque habitant morbi tristique senectus et
              netus et malesuada fames ac turpis egestas.
            </p>
            <p :class="[tokens.text.primary, 'mt-3 leading-relaxed']">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Suspendisse potenti. Integer lacinia eros a sapien fermentum,
              quis mollis diam ultricies. Maecenas nec libero ex. Nulla
              facilisi. Sed vehicula, odio eget tincidunt suscipit, nunc risus
              laoreet ligula, eget efficitur nunc tellus id nisl.
            </p>
          </section>

          <section :class="[tokens.backgrounds.secondaryPanel, 'w-full p-5']">
            <p :class="[tokens.text.accent, 'text-sm uppercase tracking-[0.22em]']">
              The Team
            </p>
            <p :class="[tokens.text.primary, 'mt-4 leading-relaxed']">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
              sodales, arcu et auctor pharetra, augue lectus gravida dolor, in
              lacinia dui nibh eget purus. Proin condimentum fermentum nunc,
              ac mattis justo vulputate ac. Integer interdum, ligula non
              tincidunt commodo, enim risus mollis massa, non commodo turpis
              magna quis massa.
            </p>
          </section>

          <section :class="[tokens.backgrounds.secondaryPanel, 'w-full p-5']">
            <p :class="[tokens.text.accent, 'text-sm uppercase tracking-[0.22em]']">
              Credits
            </p>
            <p :class="[tokens.text.primary, 'mt-4 leading-relaxed']">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce
              dignissim libero in lacinia fermentum. Vivamus convallis, urna
              quis ultricies tincidunt, tellus nunc aliquam nisl, eget
              vestibulum quam arcu ut velit. Morbi blandit cursus risus, ac
              cursus nulla malesuada at. Aliquam erat volutpat.
            </p>
          </section>
        </div>
      </div>
    </div>
  </section>
</template>
