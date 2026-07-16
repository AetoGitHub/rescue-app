export const adminLinkTabsUi = {
  root: 'min-h-0 overflow-hidden',
  list: 'flex-nowrap overflow-x-auto overflow-y-hidden max-w-full shrink-0',
  trigger: 'shrink-0',
} as const;

export const adminLinkTabsFlexUi = {
  ...adminLinkTabsUi,
  root: 'flex min-h-0 flex-1 flex-col overflow-hidden',
  content: 'flex min-h-0 flex-1 flex-col',
} as const;

export const modalTabsUi = {
  root: 'min-h-0 overflow-hidden',
  list: 'shrink-0 flex-nowrap overflow-x-auto overflow-y-hidden max-w-full',
  trigger: 'shrink-0',
} as const;

export const adminLinkTabsClass = 'flex flex-col gap-4';
export const adminLinkTabsFlexClass = 'flex min-h-0 flex-1 flex-col gap-4';

/** Tabs inside a scrolling slideover form — must not clip; parent form scrolls. */
export const slideoverTabsUi = {
  root: 'w-full min-h-min shrink-0 overflow-visible',
  list: 'shrink-0 overflow-y-hidden',
} as const;
