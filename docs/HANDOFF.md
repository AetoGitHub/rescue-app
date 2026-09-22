# Entrega del proyecto (handoff)

Documento de traspaso para quien retome `rescue-app`. Léelo primero; después sigue el mapa de [README.md](./README.md).

Fecha de entrega: 2026-09-22. Estado de `main` al entregar: commit `d572a13`, **119 archivos / 865 tests en verde** (`pnpm test`). No hay ramas sin mergear (`git branch -a --no-merged main` vacío).

## 1. Qué es, en una frase

Frontend **Nuxt 4** (+ Nitro como BFF) del sistema de rescates de AETO: tablero operacional de rescates, cotización, evidencias y chat; facturación/cobranza administrativa; catálogos; pagos a operadores/vendedores; portal TMS; y enlaces públicos con token para clientes. **La lógica de negocio y la base de datos viven en un backend Django que no está en este repo.**

## 2. Mapa de sistemas

```
Browser ──► Nitro (este repo, server/) ──► Django API        (NUXT_API_URL)        ← negocio, BD, auth
   │               │                  ├──► Servicio de PDFs  (NUXT_QUOTE_PDF_API_URL) ← PDF de cotización, reporte público, jobs OC TMS
   │               │                  ├──► n8n               (NUXT_N8N_*_URL)       ← geocoding, clasificador IA de cotización
   │               │                  └──► Alegra            (NUXT_ALEGRA_API_TOKEN) ← contactos e ítems contables
   │               └──► Sentry (túnel POST /tunnel)
   ├──► Firebase Realtime DB (VueFire)   ← señales de refresco (administrativo, portal TMS)
   ├──► Firebase Storage vía webhook n8n  (NUXT_PUBLIC_FIREBASE_UPLOAD_WEBHOOK_URL) ← subida de archivos
   ├──► Webhook n8n zip de evidencias     (NUXT_PUBLIC_EVIDENCE_ZIP_WEBHOOK_URL)
   └──► Google Maps JS API                (NUXT_PUBLIC_GOOGLE_MAPS_API_KEY)
```

Detalle técnico de cada flecha: [architecture.md](./architecture.md) y [api.md](./api.md).

## 3. Primer día

1. Pide acceso (ver §5) al repo GitHub `AetoGitHub/rescue-app`, al backend Django, a Sentry (`aeto-team` / `rescue-app`), a Firebase y a n8n.
2. `pnpm install`, copia `.env.example` → `.env`, rellena valores (ver [getting-started.md](./getting-started.md)).
3. `pnpm dev` → `http://localhost:3000/login`. Sin un Django accesible en `NUXT_API_URL` no podrás iniciar sesión.
4. `pnpm test` debe quedar en verde. CI (`.github/workflows/test.yml`) corre lo mismo en cada push/PR a `main`.
5. Recorre el sidebar como admin: Operacional → Administrativo → Por facturar → Portal TMS. Son los módulos con más uso y más cambios recientes.

## 4. Despliegue

- Build: `pnpm build` → `.output/` con preset Nitro **`node-server`** (ver `.output/nitro.json`). Arranque: `node .output/server/index.mjs`. Variables de entorno en runtime (las `NUXT_*` sobreescriben `runtimeConfig`).
- `SENTRY_AUTH_TOKEN` hace falta **en el build** para subir sourcemaps; los `.map` públicos se borran tras subirlos.
- El repo **no** contiene pipeline de deploy (no hay Dockerfile, `vercel.json` ni workflow de deploy). CI solo corre tests.
- **Dónde corre producción y cómo se publica:** _por completar por quien entrega_ (servidor/host, proceso, dominio, quién tiene acceso).

## 5. Accesos y credenciales a transferir

No hay secretos en esta documentación. Pide a tu líder que te dé acceso a:

| Sistema | Para qué | Variable(s) |
|---|---|---|
| GitHub `AetoGitHub/rescue-app` | Código, CI | — |
| Backend Django (repo + URL por ambiente) | API de negocio | `NUXT_API_URL` |
| Servicio de PDFs (repo + URL) | Cotización PDF, reporte público, jobs de OC | `NUXT_QUOTE_PDF_API_URL` |
| n8n (`n8n.srv1137762.hstgr.cloud`) | Webhooks de geocoding, clasificador, upload Firebase, zip | `NUXT_N8N_*`, `NUXT_PUBLIC_*_WEBHOOK_URL` |
| Firebase (proyecto de VueFire) | RTDB + Storage | `NUXT_PUBLIC_VUEFIRE_*` |
| Google Cloud (Maps) | Mapas y Places | `NUXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| Alegra | Contactos/ítems contables | `NUXT_ALEGRA_API_TOKEN` |
| Sentry (`aeto-team` / `rescue-app`) | Errores y sourcemaps | `SENTRY_AUTH_TOKEN` |
| Servidor de producción | Deploy | — |
| Sesión | Cifrado de cookie (≥ 32 caracteres, igual en todas las instancias) | `NUXT_SESSION_PASSWORD` |

Responsables de cada sistema externo (backend Django, servicio de PDFs, n8n): _por completar por quien entrega_.

## 6. Riesgos y pendientes conocidos

### Seguridad (atender primero)

- **`.env.example` está versionado con un valor real en `NUXT_ALEGRA_API_TOKEN`.** Hay que **rotar** ese token en Alegra y dejar la variable vacía en `.env.example`. Borrarlo del archivo no basta: sigue en el historial de git.

### Deuda técnica

- **Código `@deprecated` pendiente de retirar** (~20 marcas). Las relevantes para negocio:
  - `rescue-administrative-flow.ts`: `administrative/change_phase` para guardar OC, «hasta que backend confirme el nuevo contrato». Confirmar con backend y quitar.
  - `quote-pricing.ts`: funciones antiguas de pricing mantenidas «para migración gradual» → todo debería usar `computeQuotePricing`.
  - `rescue-create.ts`: schemas de paso de cotización sin `serviceType`.
  - Búscalas con `grep -rn "@deprecated" app server shared`.
- **Handlers duplicados** `server/api/nexxt-step/fill_oc.*` y `fill-oc.*` por compatibilidad de URL. No borrar ninguno sin confirmar qué usa n8n.
- **`server/api/payment/balance/operative.get.ts`** convive con el proxy genérico del mismo path. Leer ambos antes de tocar el contrato.
- **Restos del asistente de Sentry**: `app/pages/sentry-example-page.vue` y `server/api/sentry-example-api.ts`. Se pueden borrar.
- **`/admin/dashboard`** existe, pero está vacío y no aparece en el sidebar.
- Módulos `@nuxt/hints` y `@nuxt/a11y` instalados pero comentados en `nuxt.config.ts`.
- **Sin contrato formal con Django.** No hay OpenAPI: los contratos se deducen de `app/constants/*-api.ts`, mappers y schemas. Cualquier cambio de campo en backend rompe en silencio. Coordina con backend antes de renombrar.

### Comportamientos que parecen bugs pero son intencionales

- Los botones **Asignar proveedor / autorizador** están disponibles en **cualquier fase**, incluso cerrado o cancelado (decisión de producto, 2026-09-16).
- Descargar PDFs fuerza `application/octet-stream` y, **solo en iOS**, usa la hoja de compartir (`shareOrDownloadBlob` en `app/utils/download-blob.ts`). Es para esquivar Quick Look en Safari. Ver [rescue.md](./domains/rescue.md#descargas-de-pdf-y-safari).
- «Ver PDF» abre la pestaña **antes** del `await` para conservar el gesto de usuario en Safari.
- Un 401 de sesión **no** redirige solo a `/login`: muestra `session_expired` ([auth.md](./domains/auth.md)).
- `/admin/**` es SPA (sin SSR). Un refresh muestra el spinner de `spa-loading-template.html`.

## 7. Dónde está cada cosa (atajo)

| Quiero cambiar… | Empieza en |
|---|---|
| Un permiso por rol | `shared/abilities.ts`, `shared/utils/admin-route-access.ts`, `shared/utils/admin-api-access.ts` |
| El sidebar | `app/composables/useAdminNavConfig.ts` |
| Un endpoint | `app/constants/*-api.ts` + composable `use*` |
| Un formulario | `app/schemas/*.ts` (Zod) + componente |
| Fases/botones del rescate | `app/utils/rescue-operative-flow.ts`, `app/constants/rescue-operative-flow.ts` |
| Flujo de facturación | `app/constants/rescue-administrative-flow.ts` |
| Precios de cotización | `app/utils/quote-pricing.ts` |
| Proxy / sesión | `server/api/[...].ts`, `server/utils/django-proxy.ts`, `server/utils/auth-refresh.ts` |

## 8. Cómo se ha trabajado

- Commits convencionales en español o inglés: `fix(rescue): …`, `feat(rescue): …`. Scope habitual: `rescue`.
- Trabajo directo sobre `main` en los últimos meses, con ramas cortas para features grandes.
- Reglas de código para agentes/IDE en `.cursor/rules/*.mdc`; resumen en [conventions.md](./conventions.md).
- Toda feature nueva actualiza `docs/` ([how-to-document.md](./how-to-document.md)).
