# Arquitectura

## Qué es este proyecto

SPA/SSR **Nuxt 4** (`compatibilityDate: 2025-07-15`) con UI **Nuxt UI 4**, estado **Pinia** + queries **Pinia Colada**, formularios **Zod**, mapas **vue3-google-map**, auth **nuxt-auth-utils** + **nuxt-authorization**, Firebase **nuxt-vuefire**, errores **Sentry**.

El título de la app es `Rescates`; `htmlAttrs.lang` es `es-MX`. Fuente: Barlow (Google Fonts). CSS: `app/assets/css/main.css` + Tailwind 4.

## Árbol relevante

| Ruta | Rol |
|---|---|
| `app/pages/` | Rutas de usuario (file-based routing) |
| `app/components/` | Vue; auto-importados (ver [conventions.md](./conventions.md)) |
| `app/composables/` | Datos, mutaciones, UI helpers |
| `app/schemas/` | Zod (no inline en `.vue`) |
| `app/constants/` | Paths API, columnas kanban, copy |
| `app/utils/` | Mappers, paginación, pricing, flujos |
| `app/interfaces/` | Tipos TypeScript |
| `app/middleware/` | `auth`, `guest`, `authorization`, `redirect.global` |
| `app/layouts/default.vue` | `UDashboardGroup` + `SharedSidebar` |
| `app/plugins/` | Resolver de autorización cliente; Sentry+Pinia |
| `server/api/` | Handlers Nitro (auth, proxy catch-all, n8n, PDF, Alegra, fill-oc) |
| `server/plugins/` | Refresh de sesión; resolver de usuario en servidor |
| `shared/` | Abilities, roles, acceso por ruta/API (cliente y servidor) |
| `test/unit`, `test/nuxt`, `test/e2e/responsive` | Tests |

Alias `#shared` apunta al directorio `shared/` (`nuxt.config.ts`).

## Flujo de una petición autenticada al backend

1. El cliente llama `$fetch` / `useApiFetch()` (`useRequestFetch()`) a un path relativo `/api/...`.
2. Nitro: si no hay handler más específico, `server/api/[...].ts` exige sesión, autoriza con `abilityForApiPath`, y hace `proxyRequest` a `joinURL(apiUrl, event.path)` con `Authorization: Token <session.token>` y `Accept-Language: es`.
3. Excepción: paths `/api/nexxt-step/` no usan Token de sesión; Django recibe `Authorization: Api-Key` (ver [guest-and-fill-oc.md](./domains/guest-and-fill-oc.md)).

Handlers **propios** (no proxy Django genérico) incluyen login/logout/password-reset, mapas n8n, clasificador de cotización, PDF (`/api/quotes/:id`), Alegra, evidencias/cotización/chat/cards con token de invitado, upload TMS, balance operativo, fill-oc.

## Auth y autorización

- Login: `POST /api/auth/login` (Nitro) → Django `/api/auth/login/` → `setUserSession` con `user` + `token`.
- Cada fetch de sesión: plugin `server/plugins/auth-session.ts` llama `refreshAuthSession` → Django `/api/auth/refresh/`. 401/403 limpian la sesión.
- Cliente: `app/plugins/authorization-resolver.ts` expone `resolveClientUser`.
- Servidor: `server/plugins/authorization-resolver.ts` usa `getUserSession`.
- Rutas `/admin/*`: layout vía `app/pages/admin.vue` con middleware `auth` + `authorization`.
- `/` (`redirect.global.ts`): si hay sesión, `defaultHomeForRole`; si no, redirige a `/admin/operational` (el middleware `auth` de esa zona pedirá login).

Roles normalizados: `admin`, `operator`, `seller`, `client` (alias `administrator` → `admin`). Rol `client` va a `/unauthorized`. Staff (`admin` | `operator` | `seller`) entra al home operacional. Detalle en [auth.md](./domains/auth.md).

## Datos en el cliente

Patrón habitual: `useInfiniteQuery` / `useQuery` / `useMutation` de Pinia Colada, keys estables (`['operational-rescue-cards']`, etc.), invalidación en mutaciones. Listas infinitas de catálogo: `useCatalogInfiniteList`.

Firebase Realtime Database: constante `FIREBASE_ADMINISTRATIVE_VIEW_REFRESH_PATH` (`rescue_2/counters/general/administrative_view_refresh`) para refrescar la vista administrativa.

## Páginas públicas vs admin

- Públicas / sin layout dashboard: `/login`, `/password-reset`, `/unauthorized`, `/rescue/:id/authorization/:token`, `/admin/llenar-oc` (página `llenar-oc.vue` con `definePageMeta.path`, **sin** middlewares de `admin.vue`).
- Admin: hijas de `app/pages/admin.vue` (sí session + abilities).

## Observabilidad

- `@sentry/nuxt`: sourcemaps, `authToken` desde `SENTRY_AUTH_TOKEN`.
- Túnel `POST /tunnel` para envelopes del browser.

## Lo que este repo no es

No hay modelos de base de datos ni OpenAPI del Django. Los contratos se infieren de `app/constants/*-api.ts`, mappers y schemas Zod del frontend.
