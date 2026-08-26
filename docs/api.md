# API (frontend ↔ backend)

Este archivo lista **paths que aparecen en el código** de `rescue-app`. No es un OpenAPI del Django. No se documentan bodies campo a campo salvo cuando hay un mapper/schema explícito; para eso ver `app/utils/*-api-map.ts` y `app/schemas/`.

## Cliente autenticado

- Helper: `useApiFetch()` → `useRequestFetch()` (reenvía cookies de sesión en SSR).
- Destino: mismo origen `/api/...`.
- Nitro catch-all (`server/api/[...].ts`):
  - `requireUserSession`
  - `authorize(event, abilityForApiPath(event.path))`
  - Proxy a `runtimeConfig.apiUrl` + el mismo path
  - Headers: `Authorization: Token <token>`, `Accept-Language: es`

## Autorización por prefijo de path API

Fuente: `shared/utils/admin-api-access.ts`.

| Condición | Ability |
|---|---|
| path contiene `/dropdown` | `accessDropdown` (cualquier usuario autenticado) |
| `/api/catalogue/.../detail/` | `accessOperational` |
| resto `/api/catalogue/` | `accessCatalogs` |
| `/api/alegra/` | `accessCatalogs` |
| `/api/credit/company/` | `accessCatalogs` |
| `/api/auth/operative/commission/` | `accessConfig` |
| `/api/auth/user/` | `accessUsers` |
| `/api/invoicing/` | `accessAdministrative` |
| `/api/nexxt-step/` | `accessAdministrative` (en el mapa; el catch-all **no** aplica Token si es nexxt-step) |
| `/api/rescue/administrative/` | `accessAdministrative` |
| `/api/payment/balance/` | `accessMyBalance` |
| `/api/payment/receipt` | `accessPaymentReceipts` |
| `/api/payment/debt/create` | `accessPayments` |
| resto `/api/payment/debt` | `accessMyBalance` |
| resto `/api/payment/` | `accessPayments` |
| `/api/sla/` | `accessConfig` |
| resto `/api/rescue/` | `accessOperational` |
| default | `accessAdminApp` |

Nota: `/api/credit/check/`, `/api/credit/create/`, unlocks, etc. **no** coinciden con `/api/credit/company/` y caen en el default `accessAdminApp` salvo que otro prefijo aplique.

## Auth (handlers Nitro, no proxy genérico)

| Método y path en el frontend | Destino / efecto |
|---|---|
| `POST /api/auth/login` | Django `POST /api/auth/login/`; guarda sesión |
| `POST /api/auth/logout` | `clearUserSession` |
| `POST /api/auth/password-reset/request` | ver `server/api/auth/password-reset/request.post.ts` |
| `POST /api/auth/password-reset/confirm` | ver handler homónimo |
| `GET /api/auth/api-key/token/` | Token staff para fill-oc (sesión + Api-Key hacia Django) |
| (servidor) `GET /api/auth/refresh/` | Lo llama Nitro al hidratar sesión, no el browser directamente |

## Paginación

Ver [conventions.md](./conventions.md). El `next` del Django es una URL absoluta; el cliente **solo** reenvía `cursor`.

## Rescate operacional

Constantes: `app/constants/rescue-api.ts`, `rescue-operative-flow.ts`, `rescue-quote-api.ts`, `rescue-evidence-api.ts`, `rescue-chat-api.ts`, `rescue-supplier-api.ts`, `rescue-approve-link-api.ts`, `rescue-admin-doc-api.ts`, `rescue-cards-summary.ts`.

| Path (patrón) | Uso en UI |
|---|---|
| `POST /api/rescue/` | Crear solicitud (`RescueRequestModal`) |
| `GET /api/rescue/cards/` | Kanban |
| `GET /api/rescue/list/` | Vista lista |
| `GET /api/rescue/cards/:id/` | Detalle operacional |
| `GET /api/rescue/cards/summary/` | Resumen de columnas |
| `POST /api/rescue/update/:id/` | Update genérico (constante `RESCUE_UPDATE_PATH`) |
| `POST /api/rescue/change_phase/:id/` | Transiciones operativas |
| `POST /api/rescue/revert_cancellation/:id/` | Revertir cancelación |
| `POST /api/rescue/claim/:id/` | Obtener / reclamar rescate |
| `POST /api/rescue/quote/create/` | Cotización al crear. Body: `buildRescueQuoteCreateBody`. Cada `services[]` incluye `blame_data_raw` (`{}` si no hay override). |
| `GET/PUT /api/rescue/quote/detail/:id/` y `.../update/:id/` | Cotización. Update: `buildRescueQuoteUpdateBody` (mismo `services[].blame_data_raw`). |
| `GET /api/quotes/:id` | PDF (Nitro → `NUXT_QUOTE_PDF_API_URL`) |
| `GET /api/rescue/evidence/:id/` y `.../create/` | Evidencias |
| `GET/POST /api/chat/:id/messages/` y `.../create/` | Chat operativo |
| `GET /api/rescue/supplier/:id/` | Proveedor del rescate |
| `POST /api/rescue/approve_link/:id/generate/` | Link de autorización |
| `GET /api/rescue/dropdown/` | Dropdowns de rescate |
| `GET/POST /api/rescue/admin_doc/:id/` | Documentos admin en el detalle |
| `GET /api/rescue/settings/general/` | Settings generales |
| `GET /api/rescue/client/settings/:id/` | Settings por cliente |
| `POST /api/quote/classify` | Clasificador n8n (sesión requerida) |

Invitado (token en URL; handlers Nitro dedicados):

- `GET /api/rescue/cards/:id/:token/`
- `GET /api/rescue/quote/detail/:id/:token/`
- `GET /api/rescue/evidence/:id/:token/`
- `GET /api/chat/:id/messages/:token/`
- `POST /api/chat/:id/messages/create/:token/`
- `POST /api/rescue/approve_link/:id/:token/`

## Rescate administrativo

`app/constants/rescue-administrative-flow.ts`:

| Path | Uso |
|---|---|
| `GET /api/rescue/administrative/cards/` | Kanban (`status` requerido en comentarios del kanban) |
| `GET /api/rescue/administrative/list/` | Lista |
| `GET /api/rescue/administrative/cards/:id/` | Detalle |
| `GET /api/rescue/administrative/cards/summary/` | Resumen |
| `POST /api/rescue/change_admin_status/:id/` | Transición de billing |
| `POST /api/rescue/administrative/change_phase/:id/` | Marcado `@deprecated` para OC hasta confirmar contrato |
| `POST /api/rescue/administrative/revert_cancellation/:id/` | Revertir cancelación admin |
| `POST /api/rescue/unlock/:id/create/` | Unlock de edición |

## Catálogo y crédito

| Path | Uso |
|---|---|
| `/api/catalogue/client/list\|create\|update\|detail/` | Clientes |
| `/api/catalogue/client/:id/contacts/` y contact CRUD | Contactos |
| `/api/catalogue/client/:id/has_responsible/` | Flag responsable |
| `/api/catalogue/client/:id/contacts/authorizers/dropdown/` | Autorizadores |
| `/api/catalogue/client/:id/csf/` | CSF |
| `/api/catalogue/company/list\|create\|update\|detail\|dropdown/` | Compañías |
| `/api/catalogue/contract/list\|create\|update\|detail/` | Contratos |
| `/api/catalogue/contract/:id/items/` | Ítems |
| `/api/catalogue/contract/:id/item/create/` | Alta ítem |
| `/api/catalogue/contract/item/update\|delete/:id/` | Ítem |
| `/api/catalogue/contract/:id/items/template/` y `.../upload/` | Importar precios |
| `/api/catalogue/service/list\|create\|update\|detail\|dropdown/` | Servicios |
| `/api/catalogue/multipurpose/list\|dropdown/` | `type=service_category\|cancellation_reason\|...` |
| `/api/supplier/list\|map\|create\|update\|detail/` | Proveedores |
| `/api/supplier/:id/review/create/` | Review |
| `/api/credit/client/:id/` | Perfil crédito cliente |
| `/api/credit/company/:id/` y `create` / `update/:id` | Crédito compañía |
| `POST /api/credit/create/` y `.../update/:id/` | Crédito al guardar cliente |
| `POST /api/credit/check/` | Gate antes de cotizar |
| `/api/credit/unlock/create/` , `/:id/`, `/:id/cancel/`, `/company/:companyId/` | Extensiones |
| `/api/credit/client/:id/invoices/` | Facturas pendientes crédito |
| `/api/alegra/contacts` y `/api/alegra/items` | Proxy Alegra (offset pagination) |
| Dropdowns | `/api/catalogue/client\|company\|service/dropdown/`, `/api/auth/user/dropdown/` |

## Pagos y dashboard cobranza

`app/constants/payment-api.ts`, `pending-invoice-api.ts`, `pending-charge-api.ts`:

- `/api/payment/balance/operative/`, `/api/payment/balance/seller/`
- `/api/payment/operative/`, `/api/payment/seller/`
- `/api/payment/cart/`, `/api/payment/cart/pay/`
- `/api/payment/debt/`, `/api/payment/debt/create/`
- `/api/payment/receipt/` y `/api/payment/receipt/:id/`
- Handler Nitro extra: `GET /api/payment/balance/operative` (`server/api/payment/balance/operative.get.ts`) — existe además del path con slash en constants; no asumir que son el mismo contrato sin leer ambos.
- `/api/dashboard/pending_invoice/`, `by_responsible/`, `company_matrix/`
- Dropdowns `pending_invoice` y `pending_charge` bajo `/api/dashboard/...`

## Configuración y usuarios

- `/api/auth/user/list|create|update|detail/`
- `/api/auth/user/password-reset/:id/`
- `/api/auth/operative/commission/`, `/:operatorId/`, `/bulk/`
- `/api/sla/list|create|update/:id/`
- `/api/sla/level_alert/...`
- `/api/sla/update_chat/...`

## Portales y fill-oc

- `/api/invoicing/client_portal/tms/rescues/`
- `/api/invoicing/client_portal/tms/trigger/`
- `POST /api/portals/tms/purchase-orders/upload` (Nitro)
- `/api/nexxt-step/fill_oc/` (Api-Key; también aliases `fill-oc` en `server/api/nexxt-step/`)
- `/api/fill-oc/staff/*` → reescribe a `/api/...` en Django con Token de chat

## Mapas (Nitro → n8n)

- `POST /api/maps/coords-to-address`
- `POST /api/maps/link-to-coords`

Sesión requerida en esos handlers.

## Cómo añadir un endpoint

1. Constante en `app/constants/` si es de dominio.
2. Composable con `useApiFetch`.
3. Registrar ability en `abilityForApiPath` si el prefijo actual no cubre el caso.
4. Actualizar **este archivo**.
