import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';

export function useGuestApiFetch() {
  return $fetch;
}

export type GuestApiFetch = typeof $fetch;

export function guestApiFetch<T>(
  request: NitroFetchRequest,
  options?: NitroFetchOptions<NitroFetchRequest>,
): Promise<T> {
  return $fetch<T>(request, options);
}
