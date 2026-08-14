<script setup lang="ts">
const { isMobile } = useResponsive();
const scrollRef = ref<HTMLElement | null>(null);
const showHint = ref(true);
const activeIndex = ref(0);

let rafId = 0;

const isColumnMounted = computed(() => {
  const active = activeIndex.value;
  const windowed = isMobile.value;
  return (index: number) =>
    isKanbanColumnInMountWindow(index, active, { windowed });
});

function updateActiveIndex() {
  const el = scrollRef.value;
  if (!el) return;

  const row = el.firstElementChild;
  if (!row) return;

  const containerLeft = el.getBoundingClientRect().left;
  const childLefts = Array.from(row.children, (child) =>
    (child as HTMLElement).getBoundingClientRect().left,
  );

  const nextIndex = getKanbanActiveColumnIndex(containerLeft, childLefts);
  if (nextIndex !== activeIndex.value) {
    activeIndex.value = nextIndex;
  }
}

function scheduleActiveIndexUpdate() {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    rafId = 0;
    updateActiveIndex();
  });
}

function onScroll() {
  if (showHint.value && scrollRef.value && scrollRef.value.scrollLeft > 24) {
    showHint.value = false;
  }
  scheduleActiveIndexUpdate();
}

onMounted(() => {
  updateActiveIndex();
  if (
    scrollRef.value
    && scrollRef.value.scrollWidth <= scrollRef.value.clientWidth
  ) {
    showHint.value = false;
  }
});

onBeforeUnmount(() => {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
});
</script>

<template>
  <div class="relative flex min-h-0 flex-1 flex-col overflow-hidden">
    <div
      ref="scrollRef"
      class="kanban-scroll min-h-0 flex-1 overflow-x-auto overflow-y-hidden"
      @scroll.passive="onScroll"
    >
      <div
        class="flex h-full min-h-0 min-w-max items-stretch gap-3 p-1"
        :class="isMobile ? 'snap-x snap-proximity' : 'snap-x snap-mandatory'"
      >
        <slot :is-column-mounted="isColumnMounted" />
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
          class="rounded-full border border-default bg-elevated px-3 py-1 text-xs text-muted shadow-sm"
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
