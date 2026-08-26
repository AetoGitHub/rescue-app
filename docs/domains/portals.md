# Portales (TMS)

Página: `/admin/portales/tms` (`accessAdministrative`).

## API

`app/constants/tms-portal-api.ts`:

- Lista/actualización: `/api/invoicing/client_portal/tms/rescues/`
- Trigger: `/api/invoicing/client_portal/tms/trigger/`
- Upload OC: `POST /api/portals/tms/purchase-orders/upload` (handler Nitro)

La etiqueta de cliente TMS en el alta de rescate es la constante `TMS_CLIENT_LABEL` (`'TMS'`), no un id fijo.

## UI

Componentes `app/components/portal/tms/` (upload de OC, celdas PDF, estado de guardado). Composables: `useTmsRescueList`, `useTmsRescueMutations`, `useTmsPurchaseOrderUpload`. Schema: `app/schemas/tms-portal.ts`.
