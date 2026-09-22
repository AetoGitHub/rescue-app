# Rescate operacional

Página: `/admin/operational` → `app/pages/admin/operational/index.vue`. Ability: `accessOperational` (staff).

## Tablero

- Columnas: `OPERATIONAL_KANBAN_COLUMNS` (`app/constants/operational-kanban.ts`).
- Status: `requested`, `active_without_quote`, `pending_authorization`, `waiting_advance_payment`, `approved`, `in_progress`, `closed_unpaid`, `closed`, `warranty_pending`, `canceled`.
- Datos: `useOperationalRescueCards`, `useOperationalRescueList`, `useOperationalRescueCardsSummary`.
- Vista kanban vs lista: `useRescueBoardViewMode`.
- Filtros/dropdowns: `useOperationalBoardDropdownFetchers` (compañía, cliente, usuarios). En desktop el filtro de **vehículo** va directo en el toolbar; compañía, cliente y gestor siguen en el slideover «Más filtros».
- Detalle en modal: `useRescueDetailRouteQuery` (query de ruta para abrir por id).

## Tipos de servicio

`RESCUE_SERVICE_TYPE_OPTIONS` / schema `rescue-create.ts`: `rescue`, `loan`, `direct_budget`, `proyect` (ortografía del API: `proyect`).

Alta: `OperationalRescueRequestModal` (pasos Basics, Location, Quote, Supplier, Summary). POST `/api/rescue/`; cotización opcional según `isQuoteOptionalForServiceType`.

Schemas: `app/schemas/rescue-create.ts` (pasos), más `rescue-service-update.ts`, `rescue-location-update.ts`, `rescue-supplier-assign.ts`, `rescue-authorizer-assign.ts`.

## Detalle operacional

Componentes bajo `app/components/operational/rescue-detail/` (tags `OperationalRescueDetail*`).

- Tabs: general, cotización, mapa, evidencias, chat, etc.
- Transiciones: `POST /api/rescue/change_phase/:id/` vía `useRescueOperativeMutation` + `mapOperativeUpdateToApi`.
- Botones y validaciones de UI: `app/utils/rescue-operative-flow.ts` y copy en `rescue-operative-flow.ts` (cotización requerida para autorización, evidencias para cerrar, anticipo, crédito en préstamos, etc.).
- Reclamar: `useRescueClaimMutation` → `/api/rescue/claim/:id/`.
- Revertir cancelación: motivo desde dropdown `multipurpose` (`cancellation_reason` / `reacceptance_reason`).
- Cotización: `RescueQuoteEditor`, `useRescueQuoteSave`, `useRescueQuoteDetail`, `useRescueQuotePdf`. El gate de crédito antes de crear cotización clasifica 401/sesión vs crédito insuficiente vs error de validación.
- Clasificador IA: `POST /api/quote/classify` (`useQuoteClassifierApply`) → n8n.
- Proveedor: búsqueda `useRescueSupplierSearch`, assign `useRescueSupplierAssign`, mapa en el wizard.
- Autorizador: `PUT /api/rescue/authorizer/:id/` vía `useRescueAuthorizerAssign` (`AssignAuthorizerModal`). No se manda al crear el rescate; se exige antes de cerrar (`closed`/`closed_unpaid`) — gate en `useRescueOperativeFlow.ensureAuthorizerBeforeCloseOrRedirect`, igual que el de proveedor pero sin excepción por `service_type`. Dropdown de contactos: `GET /api/catalogue/client/:id/contacts/authorizers/dropdown/`; si viene vacío, alta rápida vía `POST /api/catalogue/client/contact/create/` con `is_authorizer: true`.
- **Asignar proveedor y autorizador está permitido en cualquier fase**, incluso `closed`, `closed_unpaid` y `canceled` (decisión de producto, 2026-09-16). No hay helpers de gating por status en `GeneralTab`.
- Editar descripción/unidad (`EditServiceModal`) y ubicación (`EditLocationModal`): el `watch` de `open` usa `immediate: true` porque los modales montan con `v-if` ya abiertos; sin eso el formulario salía vacío en la primera apertura.
- Evidencias: `useRescueEvidenceList` / `useRescueEvidenceCreate`. El zip de evidencias se descarga con `downloadBlob` (evita `WebKitBlobResource error 1` en Safari).
- Chat: `useRescueChatMessages` / `useRescueChatSendMessage` / `useRescueOperativeSystemChat`.
- Unlock de edición: `useRescueUnlockMutation`, countdown `useRescueUnlockCountdown`.
- Link de autorización: `useRescueApproveLinkGenerate` → página invitado (ver [guest-and-fill-oc.md](./guest-and-fill-oc.md)).

## Precio de cotización

Utils `app/utils/quote-pricing.ts` y constantes `app/constants/quote-pricing.ts`. Hay un desglose de desarrollo (`useQuotePricingDevUnlock`, `QuotePricingDevBreakdown`).

Venta AETO de un convenio usa el **precio de contrato**, no `unit_cost × multiplicador`.

El **costo técnico** (`unit_cost` / `real_cost`) sí se puede cambiar aunque la línea tenga convenio. Al hidratar, `unit_cost = real_cost / quantity` y el convenio se reconoce por `service_id`, no porque el costo coincida con el precio de contrato. El watcher del editor solo vuelve a poner el precio del convenio cuando el operador **cambia el servicio**, no cuando cargan los settings o se reabre la cotización.

### Payload de servicios (`blame_data_raw`)

Create y update (`buildRescueQuoteCreateBody` / `buildRescueQuoteUpdateBody` en `app/utils/rescue-quote-create.ts`) envían `services[].blame_data_raw` **siempre**:

- `{}` si no hay override explícito de venta AETO ni de precio aplicado.
- Objeto con `client_price` y/o `applied_price` (`original`, `user_id`, `username`) cuando el operador sí cambió el precio.

No va `null` ni se omite el campo. El header de la cotización **no** lleva `blame_data_raw`.

### Por qué se congelaba la UI de cotización

Al elegir un servicio con convenio, `applyContractToLine` reemplazaba `line.service` por un objeto nuevo (mismo id). Eso:

1. Disparaba de nuevo los watchers de la fila (sync de convenio y de precios).
2. En `CatalogDropdownSelect`, un `:key` ligado al id **remontaba** `USelectMenu` mientras el menú cerraba, y el overlay portalizado de Reka/Nuxt UI quedaba encima de la página (`pointer-events`) — nada era clicable.

Mitigación: no sustituir `service` si el id ya coincide; no remontar el select al cambiar la selección; sincronizar precios solo cuando el snapshot cambia (`deep: true`); al hidratar el detalle, parchear `contract_item_id` en sitio (ids estables `String(service.id)`) en lugar de recrear el array de filas.

## Descargas de PDF y Safari

`app/utils/download-blob.ts`:

- `downloadBlob(blob, filename)`: anchor + `download`. Envuelve el blob como `application/octet-stream` porque Safari macOS ignora `download` en blobs PDF y abre Quick Look.
- `shareOrDownloadBlob`: **solo en iOS** (detección por userAgent `iPhone|iPod|iPad`; no por `maxTouchPoints`, que da falso positivo en trackpads de Mac) intenta `navigator.share({ files })` (Guardar en Archivos) y cae a `downloadBlob` si falla o el usuario cancela. En desktop Chrome/Edge no se usa share para no abrir el diálogo del SO.
- «Ver PDF» de la cotización (`useRescueQuotePdf`) abre la pestaña en blanco **antes** del `await` y luego la redirige; si no, Safari bloquea el popup fuera del gesto de usuario.

## Settings

- Generales: `RESCUE_GENERAL_SETTINGS_PATH`.
- Por cliente: `/api/rescue/client/settings/:id/` (`useRescueCompanySettings`).
