export function useApiFetch() {
  const apiFetch = useRequestFetch();

  return ((request, options) =>
    apiFetch(request, {
      ...options,
      onResponseError(ctx) {
        reportApiResponseError(ctx);
        return options?.onResponseError?.(ctx);
      },
    })) as typeof apiFetch;
}
