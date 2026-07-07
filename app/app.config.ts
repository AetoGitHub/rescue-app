export default defineAppConfig({
  ui: {
    colors: {
      primary: 'emerald',
      neutral: 'neutral',
    },
    button: {
      slots: {
        label: 'tracking-wider font-semibold uppercase',
      },
    },
    dashboardPanel: {
      slots: {
        body: 'bg-elevated dark:bg-default',
      },
    },
    formField: {
      slots: {
        label: 'block text-xs uppercase tracking-wider text-muted mb-2',
      },
    },
    table: {
      slots: {
        root: 'rounded-lg border border-muted bg-default',
        thead: 'bg-elevated/50',
        th: 'text-left text-xs uppercase tracking-wider text-muted',
      },
    },
    tabs: {
      slots: {
        root: 'flex items-center gap-2 overflow-hidden',
        list: 'relative flex p-1 group overflow-y-hidden',
      },
      compoundVariants: [
        {
          orientation: 'horizontal',
          variant: 'link',
          class: {
            list: 'border-b overflow-y-hidden',
          },
        },
      ],
    },
  },
});
