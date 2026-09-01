# Arranque local

## Requisitos

- **Node.js 22** (así está en `.github/workflows/test.yml`).
- **pnpm** (hay `pnpm-lock.yaml` y `pnpm-workspace.yaml`; el workspace declara el paquete raíz `.`).
- Un backend Django accesible; la URL se configura con `NUXT_API_URL` (en `nuxt.config.ts` se mapea a `runtimeConfig.apiUrl`).

Este repo **no** incluye el servidor Django ni un `docker-compose` de API.

## Instalación

```bash
pnpm install
```

`postinstall` ejecuta `nuxt prepare`.

Copia `.env.example` a `.env` y rellena valores. **No copies secretos a la documentación.** Nombres relevantes:

| Variable | Uso en la app |
|---|---|
| `NUXT_SESSION_PASSWORD` | Cookie de sesión (`nuxt-auth-utils`) |
| `NUXT_API_URL` | Base del backend Django (proxy catch-all) |
| `NUXT_ALEGRA_API_TOKEN` | Proxy Nitro hacia Alegra (`server/api/alegra/`) |
| `NUXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Mapas (`vue3-google-map`) |
| `NUXT_PUBLIC_FIREBASE_UPLOAD_WEBHOOK_URL` | Webhook público de subida |
| `NUXT_PUBLIC_EVIDENCE_ZIP_WEBHOOK_URL` | Webhook público de zip de evidencias |
| `NUXT_N8N_COORDS_TO_ADDRESS_URL` | Geocoding inverso vía n8n |
| `NUXT_N8N_LINK_TO_COORDS_URL` | Parseo de links de Maps vía n8n |
| `NUXT_N8N_RESCUE_CLASSIFIER_URL` | Clasificador de cotización (voz/texto) |
| `NUXT_QUOTE_PDF_API_URL` | Servicio de PDF (cotización y jobs de órdenes de compra). Default en código: `http://localhost:5000` |
| `NUXT_PUBLIC_GUEST_RESCUE_USE_MOCK` | Flag público `guestRescueUseMock` (detalle invitado) |
| `NUXT_PUBLIC_VUEFIRE_API_KEY` | Firebase / VueFire |
| `NUXT_PUBLIC_VUEFIRE_AUTH_DOMAIN` | Firebase |
| `NUXT_PUBLIC_VUEFIRE_DATABASE_URL` | Realtime Database |
| `NUXT_PUBLIC_VUEFIRE_PROJECT_ID` | Firebase |
| `NUXT_PUBLIC_VUEFIRE_STORAGE_BUCKET` | Storage |
| `NUXT_PUBLIC_VUEFIRE_MESSAGING_SENDER_ID` | Firebase |
| `NUXT_PUBLIC_VUEFIRE_APP_ID` | Firebase |
| `SENTRY_AUTH_TOKEN` | Upload de sourcemaps Sentry (módulo `@sentry/nuxt`) |

El `runtimeConfig` también declara `session.maxAge` desde `shared/constants/session.ts` (7 días).

## Comandos (`package.json`)

| Script | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo (README del starter: `http://localhost:3000`). Las rutas `/admin/**` son SPA (`routeRules.ssr: false` en `nuxt.config.ts`); login y páginas de token siguen en SSR. |
| `pnpm build` | `nuxt build` |
| `pnpm generate` | `nuxt generate` |
| `pnpm preview` | Preview del build |
| `pnpm lint` / `pnpm lint:fix` | ESLint (`--max-warnings 0` en lint) |
| `pnpm typecheck` | `nuxt typecheck` |
| `pnpm test` | Vitest (proyectos `unit` y `nuxt`) |
| `pnpm test:unit` | Solo `test/unit` |
| `pnpm test:nuxt` | Solo `test/nuxt` |
| `pnpm test:e2e` | Playwright (`test/e2e/responsive/`), viewports 375 y 768 |

E2E usa `PLAYWRIGHT_BASE_URL` (default `http://localhost:3000`) y puede arrancar `pnpm run dev` salvo `PLAYWRIGHT_SKIP_WEBSERVER`.

## CI

`.github/workflows/test.yml`: en push/PR a `main`/`master` (y `workflow_dispatch`) instala con pnpm 9 + Node 22 y corre `pnpm test`.

## Despliegue

No hay `vercel.json` ni pipeline de deploy en este repo. El README raíz apunta a la [guía de deployment de Nuxt](https://nuxt.com/docs/getting-started/deployment). Sentry está configurado en `nuxt.config.ts` (`org: aeto-team`, `project: rescues-web`). El túnel de envelopes está en `server/routes/tunnel.post.ts` (`POST /tunnel`).

Tras el deploy, un refresh o URL directa a `/admin/**` muestra el spinner de `app/spa-loading-template.html` hasta hidratar. El cambio de pantalla **dentro** de una sesión ya autenticada no vuelve a pedir HTML al servidor.
