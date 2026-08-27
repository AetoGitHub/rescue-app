# Usuarios y configuración

Ability: `accessUsers` / `accessConfig` (admin).

## Usuarios

- `/admin/users` — lista `/api/auth/user/list/`. La tabla muestra `commission` que ya viene en cada fila.
- Alta/edición: `UsersUserCreateSlideover` + `app/schemas/user-create.ts`.
- Paths: create/update/detail y `POST /api/auth/user/password-reset/:id/` (`app/constants/user-api.ts`).
- Roles de formulario: ver `user-select-options.ts`.

### Comisión (porcentaje ↔ fracción)

El formulario muestra y captura un porcentaje humano (`70` / `70%`). El API guarda una fracción (`0.7`).

- Input: `usePercentStringNumberModel` + `catalogPercentInputProps` (el `UInputNumber` trabaja con `0.7` y pinta `70%`; el state del form sigue en `70.00`). Debajo del campo va el helper `USER_COMMISSION_FIELD_HELP`: «Ejemplo: escribes 70 y se guarda 0.7.»
- Envío: `userCreateToCreateBody` / `userUpdateToUpdateBody` convierten con `percentStringToApiFraction` (`70` / `70%` → `0.7`).
- Carga de detalle: `mapUserDetail` usa `apiFractionToPercentString` (`0.7` → `70.00`) para que el input no muestre `0.7%`.
- Lista: columna Comisión con `formatUserCommissionPercent` sobre el campo `commission` (`0.7` → `70%`; si llegara un `70` legado, también `70%`).

## SLA

- `/admin/configuracion/sla`.
- Paths en `app/constants/sla-config.ts`: `sla`, `sla/level_alert`, `sla/update_chat` (list/create/update).
- Schema: `app/schemas/sla-config.ts`. Composables: `useSlaConfiguration`, `useSlaConfigApi`.

## Comisiones de operadores

- `/admin/configuracion/comisiones`.
- `/api/auth/operative/commission/` (+ id y `/bulk/`).
- Schema: `operative-commission.ts`.
