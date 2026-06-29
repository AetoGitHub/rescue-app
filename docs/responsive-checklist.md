# Checklist responsive — Rescates

Viewports de prueba: **375px** (iPhone SE), **768px** (iPad), **1024px** (desktop pequeño).

## Definition of Done (DoD)

1. Sin overflow horizontal en el viewport (excepto kanban/tablas con scroll interno explícito).
2. Controles táctiles ≥ 44×44px; acciones críticas sin zoom.
3. Flujo principal completable en 375px.
4. Modales/slideovers: contenido scrolleable; header/footer fijos; cierre visible.
5. Texto legible; inputs `w-full` en móvil.
6. Mapas: altura mínima usable (`min-h-48` o `40vh`).

## Matriz de pantallas

| Ruta | 375px | 768px | 1024px | Notas |
|------|-------|-------|--------|-------|
| `/login` | | | | |
| `/password-reset` | | | | |
| `/unauthorized` | | | | |
| `error.vue` | | | | |
| `/admin/operational` | | | | Kanban scroll horizontal |
| `/admin/administrativo` | | | | Kanban + lista |
| `/admin/pagar` | | | | Carrito sticky móvil |
| `/admin/pagar/checkout` | | | | |
| `/admin/pagar/recibos` | | | | |
| `/admin/pagar/recibo/:id` | | | | |
| `/admin/my-balance` | | | | |
| `/admin/catalogs/companies` | | | | |
| `/admin/catalogs/clients` | | | | Piloto ResponsiveDataList |
| `/admin/catalogs/clients/:id/credit-unlocks` | | | | |
| `/admin/catalogs/contracts` | | | | |
| `/admin/catalogs/contracts/:id` | | | | |
| `/admin/catalogs/services` | | | | |
| `/admin/catalogs/cancellation-reasons` | | | | |
| `/admin/catalogs/suppliers` | | | | |
| `/admin/catalogs/categories` | | | | |
| `/admin/users` | | | | |
| `/admin/configuracion/sla` | | | | |
| `/admin/configuracion/comisiones` | | | | |
| `/admin/dashboard` | N/A | N/A | N/A | Stub |

Estados: **OK** · **fix** · **N/A**

## Flujos críticos (smoke manual)

- [ ] Login → redirect → abrir sidebar → navegar a Operacional
- [ ] Operacional: scroll kanban, abrir detalle rescate, cerrar modal
- [ ] Nueva solicitud: wizard completo en móvil
- [ ] Administrativo: filtros, kanban, abrir detalle
- [ ] Pagar: buscar, seleccionar, carrito sticky, checkout
- [ ] Clientes: listar, abrir slideover edición

## Playwright

```bash
pnpm run test:e2e
```

Proyectos: `mobile-375`, `tablet-768`.
