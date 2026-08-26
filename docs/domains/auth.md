# Auth y autorización

## Páginas

| URL | Archivo | Middleware |
|---|---|---|
| `/login` | `app/pages/(auth)/login.vue` | `guest`, `layout: false` |
| `/password-reset` | `app/pages/(auth)/password-reset.vue` | `guest`, `layout: false` |
| `/unauthorized` | `app/pages/unauthorized.vue` | — |
| `/` | — | `redirect.global.ts` |

Login usa `UAuthForm` + Zod local (usuario/contraseña). Éxito: `fetchUserSession` y `navigateTo(defaultHomeForRole)`.

Logout: `POST /api/auth/logout` + `clearUserSession` en `SharedSidebar`.

## Sesión (`nuxt-auth-utils`)

Campos (`shared/types/auth.d.ts`):

- `user.id`, `user.name`, `user.role`, `user.is_superuser?`
- `token` (Django Token)

TTL: `SESSION_MAX_AGE` = 7 días.

Refresh: en cada `sessionHooks.fetch`, Nitro pega a Django `/api/auth/refresh/` con el Token actual y sustituye user+token.

## Roles (`shared/utils/auth-roles.ts`)

`AuthUserRole`: `'admin' | 'operator' | 'seller' | 'client'`.

- Alias: `administrator` → `admin`.
- `isStaffRole`: admin, operator, seller.
- `isUnauthorizedRole`: `client` → `/unauthorized`.
- `defaultHomeForRole`: staff → `/admin/operational`; client → `/unauthorized`.

## Abilities (`shared/abilities.ts`)

`withAdminBypass`: rol `admin` (o superuser bypass vía `isAdminRole`) pasa el check. El resto:

| Ability | Quién (además de admin) |
|---|---|
| `accessAdminApp` | staff |
| `accessOperational` | staff |
| `accessMyBalance` | staff |
| `accessAdministrative` | solo admin (tras bypass) |
| `accessCatalogs` | solo admin |
| `accessUsers` | solo admin |
| `accessConfig` | solo admin |
| `accessPayments` | solo admin |
| `accessPaymentReceipts` | staff |
| `accessDropdown` | cualquier usuario autenticado |

## Rutas admin (`abilityForAdminPath`)

Fuente: `shared/utils/admin-route-access.ts`. Middleware `authorization.ts`: si `denies(ability)`, redirige a `defaultHomeForRole`.

| Prefijo | Ability |
|---|---|
| `/admin/catalogs` | catalogs |
| `/admin/configuracion` | config |
| `/admin/users` | users |
| `/admin/pagar/recibo` | payment receipts |
| `/admin/pagar` | payments |
| `/admin/por-facturar`, `/admin/por-cobrar`, `/admin/portales`, `/admin/administrativo`, `/admin/dashboard` | administrative |
| `/admin/my-balance` | my balance |
| `/admin/operational` | operational |
| default | `accessAdminApp` |

`app/pages/admin.vue` aplica `auth` + `authorization` a todas las hijas. **Excepción:** `llenar-oc.vue` declara `path: '/admin/llenar-oc'` y **no** es hija de ese layout de middlewares.

## Nav

`ADMIN_NAV_SECTIONS` en `useAdminNavConfig.ts`. Items ocultos si `denies`. Compañías y categorías tienen página pero **no** aparecen en el sidebar (se llega por URL o desde otros flujos).
