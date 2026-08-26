# Usuarios y configuración

Ability: `accessUsers` / `accessConfig` (admin).

## Usuarios

- `/admin/users` — lista `/api/auth/user/list/`.
- Alta/edición: `UsersUserCreateSlideover` + `app/schemas/user-create.ts`.
- Paths: create/update/detail y `POST /api/auth/user/password-reset/:id/` (`app/constants/user-api.ts`).
- Roles de formulario: ver `user-select-options.ts`.

## SLA

- `/admin/configuracion/sla`.
- Paths en `app/constants/sla-config.ts`: `sla`, `sla/level_alert`, `sla/update_chat` (list/create/update).
- Schema: `app/schemas/sla-config.ts`. Composables: `useSlaConfiguration`, `useSlaConfigApi`.

## Comisiones de operadores

- `/admin/configuracion/comisiones`.
- `/api/auth/operative/commission/` (+ id y `/bulk/`).
- Schema: `operative-commission.ts`.
