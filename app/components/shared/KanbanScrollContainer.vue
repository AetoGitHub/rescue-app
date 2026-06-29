<script setup lang="ts">
const { isMobile } = useResponsive();
const scrollRef = ref<HTMLElement | null>(null);
const showHint = ref(true);

function onScroll() {
  if (!scrollRef.value || scrollRef.value.scrollLeft > 24) {
    showHint.value = false;
  }
}

onMounted(() => {
  if (scrollRef.value && scrollRef.value.scrollWidth <= scrollRef.value.clientWidth) {
    showHint.value = false;
  }
});
</script>

<template>
  <div class="relative flex min-h-0 flex-1 flex-col overflow-hidden">
    <div
      ref="scrollRef"
      class="kanban-scroll min-h-0 flex-1 overflow-x-auto overflow-y-hidden scroll-smooth"
      @scroll="onScroll"
    >
      <div
        class="flex h-full min-h-0 min-w-max snap-x snap-mandatory items-stretch gap-3 p-1"
      >
        <slot />
      </div>
    </div>

    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isMobile && showHint"
        class="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center"
        aria-hidden="true"
      >
        <span
          class="rounded-full border border-default bg-elevated/95 px-3 py-1 text-xs text-muted shadow-sm backdrop-blur-sm"
        >
          Desliza para ver más columnas →
        </span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.kanban-scroll {
  -webkit-overflow-scrolling: touch;
}
</style>
