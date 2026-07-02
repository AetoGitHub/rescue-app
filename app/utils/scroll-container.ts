export type ScrollContainerOptions = {
  behavior?: ScrollBehavior;
  bottomOffset?: number;
};

function isScrollableOverflow(value: string): boolean {
  return value === 'auto' || value === 'scroll' || value === 'overlay';
}

export function findScrollableAncestor(element: HTMLElement | null): HTMLElement | null {
  let current = element?.parentElement ?? null;

  while (current) {
    const style = window.getComputedStyle(current);
    if (
      isScrollableOverflow(style.overflowY)
      && current.scrollHeight > current.clientHeight
    ) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

export function scrollScrollableAncestorToBottom(
  element: HTMLElement | null,
  options: ScrollContainerOptions = {},
): void {
  if (element == null || typeof window === 'undefined') return;

  const { behavior = 'smooth', bottomOffset = 0 } = options;
  const container = findScrollableAncestor(element) ?? document.documentElement;
  const top = Math.max(0, container.scrollHeight - container.clientHeight - bottomOffset);

  container.scrollTo({ top, behavior });
}

export function scrollScrollableAncestorToBottomWithRetries(
  element: HTMLElement | null,
  options: ScrollContainerOptions = {},
): void {
  if (element == null || typeof window === 'undefined') return;

  const run = () => scrollScrollableAncestorToBottom(element, options);

  run();
  requestAnimationFrame(() => {
    run();
    window.setTimeout(run, 150);
    window.setTimeout(run, 400);
  });
}
