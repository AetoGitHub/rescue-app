type ResponsiveModalBind = {
  fullscreen?: boolean;
  scrollable?: boolean;
  ui?: {
    content?: string;
  };
};

type ResponsiveModalOptions = {
  /** Desktop max-width class for UModal ui.content (e.g. `max-w-6xl`). */
  desktopMaxWidth?: string;
  /** Force fullscreen on mobile. Defaults to true. */
  fullscreenOnMobile?: boolean;
  /** Enable scrollable overlay on mobile. Defaults to true. */
  scrollableOnMobile?: boolean;
};

export function useResponsiveModal(options: ResponsiveModalOptions = {}) {
  const {
    desktopMaxWidth = 'max-w-6xl',
    fullscreenOnMobile = true,
    scrollableOnMobile = true,
  } = options;

  const { isMobile } = useResponsive();

  const modalProps = computed((): ResponsiveModalBind => {
    if (isMobile.value && fullscreenOnMobile) {
      return {
        fullscreen: true,
        scrollable: scrollableOnMobile,
      };
    }

    return {
      scrollable: true,
      ui: {
        content: desktopMaxWidth,
      },
    };
  });

  return {
    isMobile,
    modalProps,
  };
}
