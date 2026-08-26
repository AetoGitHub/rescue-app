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

## Por facturar

`/admin/por-facturar` — dashboard de facturas pendientes (`PENDING_INVOICE_LIST_PATH` y agregados `by_responsible`, `company_matrix`). Componentes `app/components/pending-invoice/`.

## Por cobrar

`/admin/por-cobrar` — `PENDING_CHARGE_LIST_PATH` y dropdowns de compañías/clientes. Componentes `app/components/pending-charge/`.

## Dashboard genérico

`/admin/dashboard` existe (`admin/dashboard.vue`) con título vacío de contenido; **no** está en el sidebar. Ability: administrative.
