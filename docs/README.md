# Documentación — rescue-app

Frontend **Nuxt 4** de AETO Rescue: operación de rescates, facturación administrativa, catálogos, pagos y portales. El backend de negocio (Django) vive **fuera** de este repositorio; Nitro actúa de BFF (sesión, proxy y algunos webhooks).

Idioma de esta documentación: **español**. Identificadores de código y APIs: **inglés**, como en el repo.

## Mapa

| Documento | Contenido |
|---|---|
| [getting-started.md](./getting-started.md) | Instalar, `.env`, scripts, tests, CI |
| [architecture.md](./architecture.md) | Capas Nuxt, sesión, autorización, Firebase, Sentry |
| [conventions.md](./conventions.md) | UForm+Zod, cursor pagination, auto-imports, tags de componentes |
| [api.md](./api.md) | Cómo habla el frontend con el API (proxy, paths observados en código) |
| [how-to-document.md](./how-to-document.md) | Obligación de documentar cada cosa nueva en MD |
| [CHANGELOG-docs.md](./CHANGELOG-docs.md) | Historial de este set de docs |
| [responsive-checklist.md](./responsive-checklist.md) | Checklist de viewports (ya existía en el repo) |

## Dominios

| Documento | Ámbito |
|---|---|
| [domains/auth.md](./domains/auth.md) | Login, sesión, roles, abilities |
| [domains/rescue.md](./domains/rescue.md) | Tablero operacional, alta, cotización, evidencias, chat |
| [domains/catalog.md](./domains/catalog.md) | Clientes, compañías, contratos, servicios, crédito |
| [domains/suppliers-maps.md](./domains/suppliers-maps.md) | Proveedores, mapa, geocoding n8n |
| [domains/billing.md](./domains/billing.md) | Administrativo, por facturar, por cobrar |
| [domains/payments.md](./domains/payments.md) | Pagar, comprobantes, mi saldo |
| [domains/users-config.md](./domains/users-config.md) | Usuarios, SLA, comisiones |
| [domains/portals.md](./domains/portals.md) | Portal TMS |
| [domains/guest-and-fill-oc.md](./domains/guest-and-fill-oc.md) | Autorización por token, llenar OC |

## Convención continua

Toda feature nueva actualiza o crea un MD en `docs/` y, si hace falta, `docs/api.md`. Ver [how-to-document.md](./how-to-document.md) y `.cursor/rules/document-new-features.mdc`.
