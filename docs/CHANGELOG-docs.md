# Changelog de documentación

Registro de cambios al conjunto `docs/` (no al producto).

## 2026-08-26

- Usuarios: comisión del formulario (`70` / `70%`) se envía como fracción (`0.7`); la lista muestra el campo `commission` del API como porcentaje. El campo tiene helper «escribes 70 y se guarda 0.7».
- Pagar: orden de columnas — tasa, comisión y utilidad van justo después de folio y tipo.
- Cotización: se documenta `services[].blame_data_raw` como `{}` cuando no hay override, y la causa del congelamiento de la UI al elegir un servicio con convenio.
- Se crea el set inicial: índice, arquitectura, arranque, convenciones, API y dominios.
- Se añade la regla Cursor `document-new-features.mdc` (siempre aplicada).
- Rama: `docs/project-documentation`, a partir del commit `3841673` (`fix/quote`).
