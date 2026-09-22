# Catálogo

Ability de las páginas bajo `/admin/catalogs`: `accessCatalogs` (admin). Dropdowns de catálogo usados en operación: `accessDropdown` o detail paths con `accessOperational`.

## Páginas

| URL | Recurso | List path |
|---|---|---|
| `/admin/catalogs/clients` | Clientes | `/api/catalogue/client/list/` |
| `/admin/catalogs/clients/:clientId/credit-unlocks` | Extensiones de crédito | detalle cliente + unlocks |
| `/admin/catalogs/companies` | Compañías | `/api/catalogue/company/list/` |
| `/admin/catalogs/contracts` | Contratos | `/api/catalogue/contract/list/` |
| `/admin/catalogs/contracts/:contractId` | Contrato + ítems | detail + items |
| `/admin/catalogs/services` | Servicios | `/api/catalogue/service/list/` |
| `/admin/catalogs/suppliers` | Proveedores | `/api/supplier/list/` |
| `/admin/catalogs/cancellation-reasons` | Motivos | `/api/catalogue/multipurpose/list/?type=cancellation_reason` |
| `/admin/catalogs/categories` | Categorías de servicio | `multipurpose` `type=service_category` |

El sidebar (`useAdminNavConfig`) **no** incluye Compañías ni Categorías; las URLs existen.

## Formularios

`app/schemas/catalog-create.ts`: `companyCreateSchema`, cliente, crédito (`creditFormSchema` / `clientCreateSchema` — no mezclar names en un solo `UForm`), contratos, ítems, proveedor, etc.

Slideovers: `CatalogClientCreateSlideover`, `CompanyCreateSlideover`, `ServiceCreateSlideover`, `SupplierCreateSlideover`, `ContractItemFormSlideover`.

Listas: `useCatalogInfiniteList` + `usePaginatedTableInfiniteScroll`.

## Contactos y responsable interno (`by_user`)

Contrato de backend: `by_user` (id de un usuario admin) + `is_responsible`.

- **Crear cliente** (`CatalogClientCreateSlideover`): selector opcional «Responsable interno» (dropdown de admins). Manda `by_user` + `is_responsible` en el mismo `POST /api/catalogue/client/create/`, sin una segunda llamada a `contact/create/`.
- **Crear contacto** (`ClientContactForm`, solo alta): selector «Contacto externo» / «Responsable». Con «Responsable» se ocultan nombre, email y teléfono (los llena el backend) y la sección de Notificaciones. `clientContactFormToCreateByUserBody` (`app/schemas/catalog-create.ts`) manda esos flags de notificación en `false`.
- Dropdown de admins: `fetchUserDropdownByRole('admin', …)` en `app/utils/user-dropdown.ts` → `GET /api/auth/user/dropdown/?role=admin&name=`.
- La tarjeta `ClientContactCard` muestra la etiqueta «Responsable» si `is_responsible`.

## Crédito

Constantes `app/constants/client-credit-api.ts`. Composables: `useClientCredit`, `useCompanyCredit`, `useCreditCheck`, `useCreditUnlockList`, `useClientCreditInvoices`. Schema unlocks: `app/schemas/credit-unlock.ts`.

Tipos de cliente (`CLIENT_TYPE_OPTIONS`): `CASH`, `CREDIT`, `PUBLIC`. Facturación (`BILLING_TYPE_OPTIONS`): `DIRECT_INVOICE`, `MANUAL`, `REMISSION`.

Al crear cotización, `assertClientCreditForQuote` llama `POST /api/credit/check/`. Solo `status: false` (HTTP 200) se muestra como «Crédito insuficiente». Un 401/403 es sesión; cualquier otro error es «No se pudo validar el crédito».

## Contratos

Ítems negociados, importación plantilla/upload (`contract-import-prices-api.ts`). Servicios pueden vincular ítems Alegra (`/api/alegra/items`). Compañías/clientes pueden vincular contactos Alegra (`/api/alegra/contacts`).

## Multipurpose

`MULTIPURPOSE_CATALOGUE_TYPES`: `service_category`, `cancellation_reason`, `reacceptance_reason`.
