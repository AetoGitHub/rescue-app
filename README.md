# AETO Rescue (rescue-app)

Frontend Nuxt 4 (+ Nitro como BFF) de operación de rescates de AETO. El backend Django vive en otro repositorio.

- **Nuevo en el proyecto:** lee [docs/HANDOFF.md](./docs/HANDOFF.md).
- **Documentación completa (español):** [docs/README.md](./docs/README.md).

## Arranque rápido

Requisitos: Node 22 y pnpm.

```bash
pnpm install
cp .env.example .env   # rellena valores; ver docs/getting-started.md
pnpm dev               # http://localhost:3000
```

| Comando | Qué hace |
|---|---|
| `pnpm test` | Vitest (unit + nuxt); lo mismo corre en CI |
| `pnpm lint` | ESLint sin warnings |
| `pnpm typecheck` | `nuxt typecheck` |
| `pnpm build` | Build de producción (`.output/`, preset `node-server`) |
| `node .output/server/index.mjs` | Arranca el build |
