# Facturación administrativa y cobranza

Ability de estas rutas: `accessAdministrative` (admin).

## Tablero administrativo

- URL: `/admin/administrativo` → `app/pages/admin/administrativo/index.vue`.
- Columnas: `ADMINISTRATIVE_KANBAN_COLUMNS`. Status de billing: `invalid`, `unattended`, `in_remittance`, `invoiced`, `paid`, `canceled`, `warranty`.
- El kanban visible **omite** `invalid` (`ADMINISTRATIVE_KANBAN_VISIBLE_COLUMNS`).
- Tipos de servicio en el API admin: `rescue` | `loan`.
- Elegibilidad operativa (filtro cliente): `closed`, `closed_unpaid`, `warranty_pending`.
- Flujos permitidos según tipo de facturación del cliente: `ADMIN_BILLING_FLOWS` / `ADMINISTRATIVE_LINEAR_STEPS` en `rescue-administrative-flow.ts`.
- Mutaciones: `useRescueAdministrativeMutation` → `change_admin_status` o `administrative/change_phase` (legacy OC).
- Detalle: `app/components/administrative/rescue-detail/` (`AdministrativeRescueDetail*`).
- Refresh cruzado: path Firebase `rescue_2/counters/general/administrative_view_refresh`.
- Resumen por columna: `GET /api/rescue/administrative/cards/summary/` (`RESCUE_ADMINISTRATIVE_CARDS_SUMMARY_PATH`). El badge de la columna y el total de «N resultados» del kanban usan el **`count` del backend**, no el número de tarjetas ya cargadas. El mapper acepta `sub_total` (canónico) o `subtotal` (alias).
- Enviar remisión / factura desde la tarjeta del kanban abre `AdministrativeSendAdminDocModal` (`app/components/administrative/SendAdminDocModal.vue`). Pregunta si los folios van solo a este rescate o a otros (`extra_rescues`). En Por facturar el mismo modal se abre con `allowExtraRescues: false` (sin selector múltiple) y `editableFolios: true`. El PDF de OC es opcional (`UFileUpload`, schema `oc_pdf` en `app/schemas/rescue-admin-doc.ts`): al enviar se sube a Firebase (`uploadFileToFirebaseGeneral`, carpeta `rescue-2/rescue/:id/oc_pdf`) y el body de `POST /api/rescue/admin_doc/:id/` incluye `oc_pdf` (URL o `null`) junto a `remittance_folio`, `invoice_folio` y `extra_rescues`. Composable: `useRescueAdminDoc`.

## Por facturar

`/admin/por-facturar` — `app/pages/admin/por-facturar/index.vue`. Lista: `GET /api/dashboard/pending_invoice/` (`PENDING_INVOICE_LIST_PATH`). Agregados: `by_responsible`, `company_matrix`. Componentes `app/components/pending-invoice/`.

- Resumen: `GET /api/dashboard/pending_invoice/summary/` (`PENDING_INVOICE_SUMMARY_PATH`, `usePendingInvoiceSummary`). Mismos filtros de dropdown y de fechas que la lista (sin `cursor` ni `ordering`).
- Rango de fechas en cabecera (`PendingInvoiceDateRangeFilter`): query params `start_date` y `end_date`. Por defecto: **primer día del mes actual → hoy** (zona local). El usuario puede cambiarlos; al API se envía ISO-8601 **con el offset de la zona horaria local** (`getLocalTimeZone()`): inicio del día (`T00:00:00±HH:mm`) y fin del día (`T23:59:59±HH:mm`). Ejemplo: `2026-09-01T00:00:00-06:00`. No se manda `YYYY-MM-DD` ni UTC `Z`. Los mismos params van a los **tres listados** (`pending_invoice/`, `by_responsible/`, `company_matrix/`) y al summary.
- Totales de cabecera y toolbar: **`count`** (eventos) y **`sub_total`** etiquetado **Total sin IVA**. No se suman las filas cargadas en el cliente.
- Scroll infinito de detalle: `usePendingInvoiceList` es un `defineQuery` (una sola `useInfiniteQuery`). Si `next` es `null`, no hay más páginas. Si trae `?cursor=`, la siguiente petición es el mismo path + filtros + ese `cursor`. `loadNextPage` no dispara si ya hay fetch en curso (`canLoadNextCursorPage`).
- En la tabla de detalle, **PDF OC** (`oc_pdf`), **OC** (`purchase_order`) y **Factura** (`factura`) van al inicio (después de alerta y comentarios). El botón **Subir** de cada fila abre el mismo `AdministrativeSendAdminDocModal` del kanban (`allowExtraRescues: false`, `editableFolios: true`): remisión (OC), factura y PDF. No hay selector de varios rescates (`extra_rescues` queda `[]`). Prefill: `oc` → `remittance_folio`, `factura` → `invoice_folio`, `oc_pdf` si ya hay URL. Al enviar: Firebase + `POST /api/rescue/admin_doc/:id/` (`rescueAdminDocToBody`, `useRescueAdminDoc`).
- Mapper: `invoice_folio` (canónico), con alias `invoice_number` y `factura`. Celda: `PendingInvoiceOcPdfCell`.

## Por cobrar

`/admin/por-cobrar` — `app/pages/admin/por-cobrar/index.vue`. Lista: `GET /api/dashboard/pending_charge/` (`PENDING_CHARGE_LIST_PATH`). Componentes `app/components/pending-charge/`.

- Resumen: `GET /api/dashboard/pending_charge/summary/` (`PENDING_CHARGE_SUMMARY_PATH`, `usePendingChargeSummary`). Mismos filtros `company` / `client` / `status` que la lista.
- Totales: **`count`** (clientes) y **`sub_total`** como **Total sin IVA**.
- El load-more de la tabla usa el mismo guard de cursor que Por facturar.

## Dashboard genérico

`/admin/dashboard` existe (`admin/dashboard.vue`) con título vacío de contenido; **no** está en el sidebar. Ability: administrative.
