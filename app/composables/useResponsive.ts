import { useBreakpoints } from '@vueuse/core';

/** Tailwind v4 default breakpoints. */
const TAILWIND_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export function useResponsive() {
  const breakpoints = useBreakpoints(TAILWIND_BREAKPOINTS);

  const isMobile = breakpoints.smaller('md');
  const isTablet = breakpoints.between('md', 'lg');
  const isDesktop = breakpoints.greaterOrEqual('lg');

  return {
    isMobile,
    isTablet,
    isDesktop,
    breakpoints,
  };
}
