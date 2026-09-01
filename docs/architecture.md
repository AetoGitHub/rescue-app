# Arquitectura

## Qué es este proyecto

**Nuxt 4** (`compatibilityDate: 2025-07-15`) con UI **Nuxt UI 4**, estado **Pinia** + queries **Pinia Colada**, formularios **Zod**, mapas **vue3-google-map**, auth **nuxt-auth-utils** + **nuxt-authorization**, Firebase **nuxt-vuefire**, errores **Sentry**.

El título de la app es `Rescates`; `htmlAttrs.lang` es `es-MX`. Fuente: Barlow (Google Fonts). CSS: `app/assets/css/main.css` + Tailwind 4.

## Modo de renderizado

Híbrido (Nuxt 4.4, `routeRules`):

| Rutas | Modo | Motivo |
|---|---|---|
| `/admin/**` | Solo cliente (`ssr: false`) | Herramienta interna autenticada: no hay SEO. Los listados y detalles se piden en el browser (Pinia Colada). El SSR solo añadía TTFB de sesión (`sessionHooks.fetch` / refresh) + hidratación en cada carga completa, sin HTML útil de negocio. |
| `/login`, `/password-reset`, `/unauthorized`, `/rescue/:id/authorization/:token` | Universal (SSR) | Primera pintura del formulario o enlace de invitado sin esperar el bundle. |

Nitro **sigue** sirviendo `server/api/**` (login, proxy Django, webhooks). `ssr: false` no apaga el BFF.

Cold start de una URL `/admin/**` (refresh, enlace directo): HTML vacío + `app/spa-loading-template.html` hasta que hidrata el cliente. La cookie de sesión se resuelve entonces vía `GET /api/_auth/session` (`nuxt-auth-utils`; `useApiFetch` / `useRequestFetch` en el cliente envían la cookie).

Navegación **dentro** de la app (`UNavigationMenu` → `NuxtLink`): ya era client-side; el layout `default` y `admin.vue` persisten. No se usó `<NuxtPage keepalive>`: tableros con mapas y listeners de Firebase no deben quedarse montados.

No hay `definePageMeta({ ssr: false })` por página: la regla cubre todo `/admin/**` (incluido `/admin/llenar-oc`).

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
2. Nitro asigna `X-Request-Id` (reusa el del cliente si es válido) y lo devuelve al browser.
3. Si no hay handler más específico, `server/api/[...].ts` exige sesión **y token no vacío**, autoriza con `abilityForApiPath`, y proxifica a `joinURL(apiUrl, event.path)` con `Authorization: Token <session.token>`, `Accept-Language: es` y `X-Request-Id`. Sin token no se proxifica: 401 `data.code = session_expired`.
4. Excepción: paths `/api/nexxt-step/` no usan Token de sesión; Django recibe `Authorization: Api-Key` (ver [guest-and-fill-oc.md](./domains/guest-and-fill-oc.md)).

Handlers **propios** (no proxy Django genérico) incluyen login/logout/password-reset, mapas n8n, clasificador de cotización, PDF (`/api/quotes/:id`), Alegra, evidencias/cotización/chat/cards con token de invitado, upload TMS de OC (job: `POST .../purchase-orders/upload` + `GET .../purchase-orders/jobs/:jobId` hacia `NUXT_QUOTE_PDF_API_URL`), balance operativo, fill-oc.

## Auth y autorización

- Login: `POST /api/auth/login` (Nitro) → Django `/api/auth/login/` → `setUserSession` con `user` + `token` + `tokenRefreshedAt`.
- Fetch de sesión: plugin `server/plugins/auth-session.ts` llama `refreshAuthSession`. Solo pega a Django `/api/auth/refresh/` si pasó el TTL (`AUTH_REFRESH_TTL_MS`, 10 min). Peticiones concurrentes con el mismo token comparten un solo refresh. 401/403 del refresh limpian la sesión y responden 401 `session_expired` (no se proxifica con token vacío). Un 5xx del refresh **no** cierra la sesión.
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

- `@sentry/nuxt`: sourcemaps, `authToken` desde `SENTRY_AUTH_TOKEN`. Usuario Sentry = `id` + `role` de sesión (nunca el token).
- Túnel `POST /tunnel` (DSN alineado con `sentry.client.config.ts`) para envelopes del browser.
- `useApiFetch` reporta 4xx/5xx a Sentry **incluyendo 401/403** (excepto login y 404 / quote-not-found). Extra: `path`, `status`, body sanitizado, `request_id`, `had_session`. Fingerprint por método + path normalizado + status.
- Nitro reporta `session_auth:*` cuando falta token, el refresh limpia la sesión, o Django responde 401/403 al proxy. Extra: `had_token`, `refresh_cleared_session`, `request_id`.
- Cruzar un incidente con Django: mismo valor de `X-Request-Id`.

## Lo que este repo no es

No hay modelos de base de datos ni OpenAPI del Django. Los contratos se infieren de `app/constants/*-api.ts`, mappers y schemas Zod del frontend.
