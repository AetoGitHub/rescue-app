# Enlaces invitados y llenar OC

Estas pantallas **no** usan el middleware `auth` de `admin.vue`.

## Autorización de rescate (token)

- URL: `/rescue/:id/authorization/:token`
- Página: `app/pages/rescue/[id]/authorization/[token].vue`
- Vista: `GuestRescueDetailView`
- Fetch: `useGuestApiFetch` (`$fetch` directo a handlers Nitro con token en el path)
- Flag mock: `runtimeConfig.public.guestRescueUseMock` (`NUXT_PUBLIC_GUEST_RESCUE_USE_MOCK`) en `useGuestRescueAuthorize`

El staff genera el token con `POST /api/rescue/approve_link/:id/generate/`. El invitado aprueba con `POST /api/rescue/approve_link/:id/:token/`. Cotización, evidencias y chat tienen variantes `.../:token/` (ver [api.md](../api.md)).

## Evidencias y reporte de cotización públicos (`?api-key=`)

Páginas sin layout ni sesión, `robots: noindex, nofollow`. Si falta el id o el `api-key`, muestran «Enlace no válido o expirado».

| URL | Página | Vista | Datos |
|---|---|---|---|
| `/rescue/:id/evidencias?api-key=…` | `app/pages/rescue/[id]/evidencias.vue` | `GuestRescueDetailEvidenceView` | `useGuestRescueEvidence` → `GET /api/rescue/evidence/:id/:token/` (`RESCUE_GUEST_EVIDENCE_LIST_PATH`, el `api-key` va como token) |
| `/rescue/:id/reporte-cotizacion?api-key=…` | `app/pages/rescue/[id]/reporte-cotizacion.vue` | `GuestRescueDetailReportView` | `GET /api/quotes/report/:id/:apikey` |

`server/api/quotes/report/[id]/[apikey].get.ts` reenvía a `{NUXT_QUOTE_PDF_API_URL}/quotes/report/:id/:apikey` (el servicio de PDFs valida el apikey) y hace stream del PDF con su `Content-Disposition`. Errores: 400 si falta id/apikey, 502 si no conecta con el servicio de PDFs.

## Llenar OC (n8n / Api-Key)

- URL pública conservada: `/admin/llenar-oc` (`app/pages/llenar-oc.vue`, `layout: false`)
- Query `?key=`: Nitro la manda a Django como `Authorization: Api-Key`
- También acepta header `x-api-key` (`nexxt-step-api.ts`)
- Backend path: `/api/nexxt-step/fill_oc/`
- En desarrollo se muestra `AdministrativeFillOcDevPreview`
- `robots: noindex, nofollow`

Hay handlers duplicados `fill_oc` y `fill-oc` bajo `server/api/nexxt-step/` por compatibilidad de path.

## Staff proxy (chat / evidencia)

`/api/fill-oc/staff/*` reescribe a `/api/*` en Django usando `Authorization: Token` del header (token de chat), no la sesión cookie. Relacionado: `GET /api/auth/api-key/token/` para obtener credenciales de staff autenticado.

Utils: `fill-oc-staff-paths.ts`, `fill-oc-staff-token.ts`, `server/utils/fill-oc-staff-auth.ts`. Schema UI: `app/schemas/fill-oc.ts`.
