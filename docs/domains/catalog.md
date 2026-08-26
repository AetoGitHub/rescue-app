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

## Crédito

Constantes `app/constants/client-credit-api.ts`. Composables: `useClientCredit`, `useCompanyCredit`, `useCreditCheck`, `useCreditUnlockList`, `useClientCreditInvoices`. Schema unlocks: `app/schemas/credit-unlock.ts`.

Tipos de cliente (`CLIENT_TYPE_OPTIONS`): `CASH`, `CREDIT`, `PUBLIC`. Facturación (`BILLING_TYPE_OPTIONS`): `DIRECT_INVOICE`, `MANUAL`, `REMISSION`.

Al guardar cliente con crédito, `ClientCreateSlideover` llama `/api/credit/create/` o `/api/credit/update/:id/` además del catálogo.

## Contratos

Ítems negociados, importación plantilla/upload (`contract-import-prices-api.ts`). Servicios pueden vincular ítems Alegra (`/api/alegra/items`). Compañías/clientes pueden vincular contactos Alegra (`/api/alegra/contacts`).

## Multipurpose

`MULTIPURPOSE_CATALOGUE_TYPES`: `service_category`, `cancellation_reason`, `reacceptance_reason`.
