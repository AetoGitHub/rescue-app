export default defineNitroPlugin(() => {
  sessionHooks.hook('fetch', async (session, event) => {
    await refreshAuthSession(event, session);
  });
});
