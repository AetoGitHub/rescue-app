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
        root: 'rounded-lg border border-muted',
        thead: 'bg-elevated/50',
        th: 'text-left text-xs uppercase tracking-wider text-muted',
        td: 'bg-default',
      },
    },
  },
});
