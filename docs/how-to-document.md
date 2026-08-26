# Cómo documentar trabajo nuevo

Cada feature, módulo, página, composable de datos, schema Zod o handler Nitro debe quedar reflejado en Markdown bajo `docs/`. La regla de Cursor `.cursor/rules/document-new-features.mdc` lo exige en cada sesión de agente.

## Flujo

1. Implementa el cambio en código.
2. Elige el archivo de dominio en `docs/domains/` o crea uno (`kebab-case`).
3. Actualiza tablas de rutas, paths API y convenciones si aplican.
4. Añade el enlace en [README.md](./README.md).
5. Anota una línea en [CHANGELOG-docs.md](./CHANGELOG-docs.md) si el conjunto de docs cambia de forma notable.

## Granularidad

- Un dominio = un archivo (`rescue.md`, `catalog.md`). No un MD por cada componente Vue.
- Si una página es un flujo completo (p. ej. portal TMS), descríbela en el dominio correspondiente.
- Los detalles de UI (clases Tailwind, copy de toasts) no van a docs salvo que definan reglas de negocio.

## Precisión

Documenta **solo** lo que el código hace. Si el backend no está en este repo, no inventes query params, códigos HTTP ni campos de body: cita el mapper o la constante (`app/constants/`, `app/utils/*-api-map.ts`).

## Relación con otras reglas

Las convenciones de formularios, paginación y auto-imports viven en `.cursor/rules/` y se resumen en [conventions.md](./conventions.md). Si cambias una convención, actualiza **ambos**: la regla y el MD.
