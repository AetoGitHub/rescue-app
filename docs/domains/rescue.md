# Rescate operacional

Página: `/admin/operational` → `app/pages/admin/operational/index.vue`. Ability: `accessOperational` (staff).

## Tablero

- Columnas: `OPERATIONAL_KANBAN_COLUMNS` (`app/constants/operational-kanban.ts`).
- Status: `requested`, `active_without_quote`, `pending_authorization`, `waiting_advance_payment`, `approved`, `in_progress`, `closed_unpaid`, `closed`, `warranty_pending`, `canceled`.
- Datos: `useOperationalRescueCards`, `useOperationalRescueList`, `useOperationalRescueCardsSummary`.
- Vista kanban vs lista: `useRescueBoardViewMode`.
- Filtros/dropdowns: `useOperationalBoardDropdownFetchers` (compañía, cliente, usuarios).
- Detalle en modal: `useRescueDetailRouteQuery` (query de ruta para abrir por id).

## Tipos de servicio

`RESCUE_SERVICE_TYPE_OPTIONS` / schema `rescue-create.ts`: `rescue`, `loan`, `direct_budget`, `proyect` (ortografía del API: `proyect`).

Alta: `OperationalRescueRequestModal` (pasos Basics, Location, Quote, Supplier, Summary). POST `/api/rescue/`; cotización opcional según `isQuoteOptionalForServiceType`.

Schemas: `app/schemas/rescue-create.ts` (pasos), más `rescue-service-update.ts`, `rescue-location-update.ts`, `rescue-supplier-assign.ts`.

## Detalle operacional

Componentes bajo `app/components/operational/rescue-detail/` (tags `OperationalRescueDetail*`).

- Tabs: general, cotización, mapa, evidencias, chat, etc.
- Transiciones: `POST /api/rescue/change_phase/:id/` vía `useRescueOperativeMutation` + `mapOperativeUpdateToApi`.
- Botones y validaciones de UI: `app/utils/rescue-operative-flow.ts` y copy en `rescue-operative-flow.ts` (cotización requerida para autorización, evidencias para cerrar, anticipo, crédito en préstamos, etc.).
- Reclamar: `useRescueClaimMutation` → `/api/rescue/claim/:id/`.
- Revertir cancelación: motivo desde dropdown `multipurpose` (`cancellation_reason` / `reacceptance_reason`).
- Cotización: `RescueQuoteEditor`, `useRescueQuoteSave`, `useRescueQuoteDetail`, `useRescueQuotePdf`.
- Clasificador IA: `POST /api/quote/classify` (`useQuoteClassifierApply`) → n8n.
- Proveedor: búsqueda `useRescueSupplierSearch`, assign `useRescueSupplierAssign`, mapa en el wizard.
- Evidencias: `useRescueEvidenceList` / `useRescueEvidenceCreate`.
- Chat: `useRescueChatMessages` / `useRescueChatSendMessage` / `useRescueOperativeSystemChat`.
- Unlock de edición: `useRescueUnlockMutation`, countdown `useRescueUnlockCountdown`.
- Link de autorización: `useRescueApproveLinkGenerate` → página invitado (ver [guest-and-fill-oc.md](./guest-and-fill-oc.md)).

## Precio de cotización

Utils `app/utils/quote-pricing.ts` y constantes `app/constants/quote-pricing.ts`. Hay un desglose de desarrollo (`useQuotePricingDevUnlock`, `QuotePricingDevBreakdown`).

## Settings

- Generales: `RESCUE_GENERAL_SETTINGS_PATH`.
- Por cliente: `/api/rescue/client/settings/:id/` (`useRescueCompanySettings`).
