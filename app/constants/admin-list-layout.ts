export const adminListDashboardPanelUi = {
  body: 'flex flex-col min-h-0 flex-1 overflow-hidden',
} as const;

export const adminListContainerClass =
  'flex min-h-0 flex-1 flex-col gap-4 w-full';

export const adminListTableClass = 'min-h-0 flex-1';

/** UTable in a flex board/list panel — pairs with `sticky` for internal scroll + infinite load. */
export const adminBoardListTableClass = 'min-h-0 flex-1 h-full';

export const adminListTableWrapperClass =
  '-mx-4 flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto px-4 sm:mx-0 sm:px-0';

/** Catalog map tab panel — fills remaining viewport below filters/tabs. */
export const adminCatalogMapPanelClass =
  'flex min-h-0 flex-1 flex-col';

export const adminListPageTitleClass = 'text-2xl font-bold tracking-tight sm:text-3xl';

export const adminListToolbarClass =
  'flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between';

export const adminListFiltersClass =
  'flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap';

export const operationalKanbanColumnClass =
  'w-[min(260px,88vw)] shrink-0 snap-start sm:w-[280px]';

export const administrativeKanbanColumnClass =
  'w-[min(280px,88vw)] shrink-0 snap-start sm:w-[300px]';

export const adminListSlideoverBodyUi = {
  body: 'flex min-h-0 flex-1 flex-col overflow-hidden',
} as const;

/** Pair with `adminListSlideoverBodyUi` so content fills the slideover height. */
export const adminListSlideoverContentClass = 'flex flex-col';

/** Single scroll owner inside slideover body (avoid max-h / nested overflow). */
export const adminListSlideoverScrollClass =
  'min-h-0 flex-1 overflow-y-auto pe-1';
