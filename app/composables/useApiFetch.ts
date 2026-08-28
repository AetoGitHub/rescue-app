export function useApiFetch() {
  const apiFetch = useRequestFetch();
  const { loggedIn } = useUserSession();

  return ((request, options) =>
    apiFetch(request, {
      ...options,
      onResponseError(ctx) {
        reportApiResponseError(ctx, { loggedIn: loggedIn.value });
        return options?.onResponseError?.(ctx);
      },
    })) as typeof apiFetch;
}
