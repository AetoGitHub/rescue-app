<template>
  <div
    class="flex max-h-[min(85vh,40rem)] min-h-[50vh] min-w-0 flex-col gap-4 lg:grid lg:h-[min(70vh,28rem)] lg:max-h-none lg:min-h-0 lg:grid-cols-2 lg:gap-4"
  >
    <div
      class="order-1 h-[38vh] min-h-48 min-w-0 shrink-0 overflow-hidden lg:order-2 lg:h-full lg:min-h-0"
    >
      <slot name="map" />
    </div>

    <div
      class="order-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:order-1 lg:h-full lg:min-h-0"
    >
      <slot name="list" />
    </div>
  </div>
</template>
