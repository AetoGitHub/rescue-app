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

## Por facturar

`/admin/por-facturar` — `app/pages/admin/por-facturar/index.vue`. Lista: `GET /api/dashboard/pending_invoice/` (`PENDING_INVOICE_LIST_PATH`). Agregados: `by_responsible`, `company_matrix`. Componentes `app/components/pending-invoice/`.

- Resumen: `GET /api/dashboard/pending_invoice/summary/` (`PENDING_INVOICE_SUMMARY_PATH`, `usePendingInvoiceSummary`). Mismos filtros de dropdown que la lista (sin `cursor` ni `ordering`).
- Totales de cabecera y toolbar: **`count`** (eventos) y **`sub_total`** etiquetado **Total sin IVA**. No se suman las filas cargadas en el cliente.
- Scroll infinito de detalle: `usePendingInvoiceList` es un `defineQuery` (una sola `useInfiniteQuery`). Si `next` es `null`, no hay más páginas. Si trae `?cursor=`, la siguiente petición es el mismo path + filtros + ese `cursor`. `loadNextPage` no dispara si ya hay fetch en curso (`canLoadNextCursorPage`).

## Por cobrar

`/admin/por-cobrar` — `app/pages/admin/por-cobrar/index.vue`. Lista: `GET /api/dashboard/pending_charge/` (`PENDING_CHARGE_LIST_PATH`). Componentes `app/components/pending-charge/`.

- Resumen: `GET /api/dashboard/pending_charge/summary/` (`PENDING_CHARGE_SUMMARY_PATH`, `usePendingChargeSummary`). Mismos filtros `company` / `client` / `status` que la lista.
- Totales: **`count`** (clientes) y **`sub_total`** como **Total sin IVA**.
- El load-more de la tabla usa el mismo guard de cursor que Por facturar.

## Dashboard genérico

`/admin/dashboard` existe (`admin/dashboard.vue`) con título vacío de contenido; **no** está en el sidebar. Ability: administrative.
