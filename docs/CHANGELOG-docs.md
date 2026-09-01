# Changelog de documentación

Registro de cambios al conjunto `docs/` (no al producto).

## 2026-09-01

- Por facturar: filtros `start_date` y `end_date` (campos de fecha en cabecera). Se envían como datetime ISO con el offset de la zona horaria del usuario (inicio y fin del día local).

## 2026-08-31

- Administrativo / cobranza: el summary de columnas expone `count`; Por facturar y Por cobrar usan `GET /api/dashboard/pending_invoice/summary/` y `GET /api/dashboard/pending_charge/summary/` (`sub_total` = total sin IVA). El scroll infinito de Por facturar/Por cobrar usa una sola `useInfiniteQuery` (`defineQuery`) y manda el `cursor` extraído de `next`.
- Cotización: el costo técnico de una línea convenio se puede modificar; al recargar ya no se pisa con el precio de contrato.

## 2026-08-28

- Auth/proxy: refresh de token con TTL de 10 min y mutex; 401 `session_expired` si no hay token; `X-Request-Id` hacia Django y de vuelta al browser.
- Observabilidad: Sentry reporta 401/403 de API (no login) y fallos de sesión en Nitro; el túnel usa el mismo DSN que el client SDK.
- Cotización: el check de crédito ya no titula cualquier fallo como «Crédito insuficiente».

## 2026-08-26

- Usuarios: comisión del formulario (`70` / `70%`) se envía como fracción (`0.7`); la lista muestra el campo `commission` del API como porcentaje. El campo tiene helper «escribes 70 y se guarda 0.7».
- Pagar: orden de columnas — tasa, comisión y utilidad van justo después de folio y tipo.
- Cotización: se documenta `services[].blame_data_raw` como `{}` cuando no hay override, y la causa del congelamiento de la UI al elegir un servicio con convenio.
- Se crea el set inicial: índice, arquitectura, arranque, convenciones, API y dominios.
- Se añade la regla Cursor `document-new-features.mdc` (siempre aplicada).
- Rama: `docs/project-documentation`, a partir del commit `3841673` (`fix/quote`).
