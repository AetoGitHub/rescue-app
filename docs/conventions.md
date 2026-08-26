# Convenciones de código

Resumen de las reglas en `.cursor/rules/`. Si hay conflicto, prevalece el archivo `.mdc` y este MD debe actualizarse.

## Formularios: UForm + Zod

Archivo: `.cursor/rules/uform-zod-forms.mdc`.

- `UForm` con `:schema` (Zod) y `:state` reactivo.
- Schemas en `app/schemas/`, no inline en `.vue` (excepción conocida: login usa Zod local en la página).
- Cada campo en `UFormField` con `name` igual a la clave del schema.
- Submit: `formRef.submit()` y `@submit`; tipos `FormSubmitEvent` / `z.infer`.
- Mensajes de error en español en el schema.
- Bodies API: `*ToCreateBody` / `*ToUpdateBody` junto al schema cuando aplique.
- Sub-formularios con **otro** schema = **otro** `UForm` (cliente vs crédito).

Mapa de schemas (también en la regla):

| Dominio | Archivo |
|---|---|
| Catálogo (cliente, compañía, crédito) | `app/schemas/catalog-create.ts` |
| Rescate | `app/schemas/rescue-create.ts` |
| Extensión de crédito | `app/schemas/credit-unlock.ts` |
| Usuarios | `app/schemas/user-create.ts` |
| Auth (reset) | `app/schemas/password-reset.ts` |
| Admin rescate | `app/schemas/rescue-administrative.ts` |
| Otros en el repo | `rescue-operative.ts`, `rescue-service-update.ts`, `rescue-supplier-assign.ts`, `rescue-location-update.ts`, `rescue-approve-link.ts`, `rescue-admin-doc.ts`, `sla-config.ts`, `operative-commission.ts`, `payment-debt-create.ts`, `fill-oc.ts`, `tms-portal.ts` |

Checklist al agregar campo: clave en schema → `emptyState()` → `UFormField` + `v-model` → mapper/body.

## Inputs numéricos y textarea

- `.cursor/rules/input-number-catalog.mdc`: no `UInput type="number"`; usar `UInputNumber` con presets de `app/utils/catalog-form.ts`.
- `.cursor/rules/textarea-nuxt-ui.mdc`: `UTextarea`, no `<textarea>` nativo.

## Auto-imports Nuxt

Archivo: `.cursor/rules/nuxt-auto-imports.mdc`.

**No importar** componentes de `app/components/`, composables de `app/composables/`, utils de `app/utils/`, ni APIs Vue/Nuxt (`ref`, `$fetch`, `useToast`, …).

**Sí importar** tipos (`~/interfaces/**`), schemas Zod, constants, paquetes npm.

### Tags en `*/rescue-detail/`

Nuxt arma el tag con carpeta + archivo y quita segmentos duplicados.

| Path | Archivo | Tag |
|---|---|---|
| `administrative/rescue-detail/` | `ManagementSection.vue` | `<AdministrativeRescueDetailManagementSection>` |
| `operational/rescue-detail/` | `FooterActions.vue` | `<OperationalRescueDetailFooterActions>` |

No repetir el prefijo de dominio en el filename. Modales lazy: `Lazy` + nombre resuelto. Tras renombres: `pnpm run postinstall` y `.nuxt/components.d.ts`.

## Paginación por cursor

Archivo: `.cursor/rules/cursor-pagination.mdc`. Utils auto-importadas: `app/utils/catalog-pagination.ts`.

Respuesta:

```ts
interface PaginatedResponse<T> {
  next: string | null; // URL completa con ?cursor=...
  previous: string | null;
  results: T[];
}
```

- Extraer **solo** el query `cursor` con `extractCursorFromPaginatedNext` / `getNextCursorPageParam`.
- Primera página: mismos filtros, **sin** `cursor`.
- Siguiente: mismos filtros + `cursor`.
- **No** fetchear `lastPage.next` como URL absoluta (rompe el proxy y los filtros).
- `useInfiniteQuery` con `initialPageParam: null`.
- Aplanar: `flattenPaginatedPages`.
- Listas nuevas: `useCatalogInfiniteList` o el mismo patrón.
- Auth: `useApiFetch()`, no `$fetch` desnudo en páginas/composables autenticados.

Alegra y APIs cuyo `next` es un offset (string tipo `"30"`): `getNextOffsetPageParam` (mismo archivo).

## Commits

`.cursor/rules/conventional-commits.mdc`: `tipo(scope): descripción` en imperativo, sujeto ≤ 72 caracteres. Tipo `docs` para este tipo de trabajo.

## Mapas

`.cursor/rules/google-maps-advanced-marker.mdc`: solo `AdvancedMarker`; pin con `:pin-options`; no `Marker` ni `PinElement` como componente Vue.

## Layout admin

`app/layouts/default.vue`: `UDashboardGroup` (`storage-key="rescue-dashboard"`) + `SharedSidebar`. Navegación filtrada por `allows(item.ability)` en `useAdminNavConfig.ts`.
