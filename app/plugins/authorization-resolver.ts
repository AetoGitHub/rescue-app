import { normalizeAuthSessionUser } from '#shared/utils/auth-roles';

export default defineNuxtPlugin({
  name: 'authorization-resolver',
  parallel: true,
  setup() {
    return {
      provide: {
        authorization: {
          resolveClientUser: () =>
            normalizeAuthSessionUser(useUserSession().user.value ?? null),
        },
      },
    };
  },
});
