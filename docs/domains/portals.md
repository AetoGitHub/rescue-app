# Portales (TMS)

Página: `/admin/portales/tms` (`accessAdministrative`).

## API

`app/constants/tms-portal-api.ts`:

- Lista/actualización: `/api/invoicing/client_portal/tms/rescues/`
- Trigger: `/api/invoicing/client_portal/tms/trigger/`
- Upload OC (job): `POST /api/portals/tms/purchase-orders/upload` (Nitro → `{NUXT_QUOTE_PDF_API_URL}/purchase-orders/upload`). Respuesta 202: `{ jobId, total }`. Hasta 100 PDF, 10 MB c/u, un solo `FormData` con el campo repetible `files`.
- Estado del job: `GET /api/portals/tms/purchase-orders/jobs/:jobId` (Nitro → `{NUXT_QUOTE_PDF_API_URL}/purchase-orders/jobs/:jobId`). 404 si expiró (TTL ~30 min o reinicio del servicio de PDFs).

La etiqueta de cliente TMS en el alta de rescate es la constante `TMS_CLIENT_LABEL` (`'TMS'`), no un id fijo.

## UI

Componentes `app/components/portal/tms/` (upload de OC, celdas PDF, estado de guardado). Composables: `useTmsRescueList`, `useTmsRescueMutations`, `useTmsPurchaseOrderUpload`. Store Pinia `useTmsPurchaseOrderJobStore` (poll en segundo plano si se cierra el modal). Schema: `app/schemas/tms-portal.ts`. Constantes de límites y paths: `app/constants/tms-portal-api.ts`.

### Refresco automático

`useTmsPortalUploadConfirmedListener` escucha en Firebase RTDB `rescue_2/counters/client_portal/tms/upload_confirmed` (`FIREBASE_TMS_PORTAL_UPLOAD_CONFIRMED_PATH`). Cuando cambia, hace `refresh()` de la tabla **sin pisar** los drafts que el usuario está editando.

### Completadas

`/admin/portales/tms/completadas` (`app/pages/admin/portales/tms/completadas.vue`); se entra con el botón «Completadas», junto a «Disparar proceso». Lista los rescates ya subidos al portal:

- API: `GET /api/invoicing/client_portal/tms/rescues/paginated/` (`TMS_RESCUE_COMPLETED_LIST_PATH`), paginado por cursor. Filtros: `correct_upload`, `manual_upload`, `folio`.
- Columna de origen: automatización (`correct_upload`) vs manual (`manual_upload`).
- Composable: `useTmsCompletedRescueList`. Helpers en `app/utils/tms-portal.ts`.

La carga masiva no bloquea con un spinner de página: muestra `completed/total`, pinta la tabla a medida que llegan `files` (merge por `fileName`) y avisa una sola vez al terminar. La celda 1×1 (`OcPdfCell`) espera el mismo job para un solo PDF.
