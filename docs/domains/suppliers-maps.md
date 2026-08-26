# Proveedores y mapas

## Catálogo de proveedores

Página `/admin/catalogs/suppliers`. CRUD: `/api/supplier/create|update|detail/`. Tipos de servicio de proveedor: `SUPPLIER_SERVICE_TYPE_OPTIONS` (`cranes`, `mechanics`, `road_assist`, `forklifts`, `flatbed`, `transport`, `other`).

Reviews: `POST /api/supplier/:id/review/create/` (`useSupplierReviewMutation`).

## Mapa en el alta / asignación

- Lista/mapa: `GET /api/supplier/map/` (`useSupplierMapList`, `useSupplierMapPins`, `useSupplierMapViewport`).
- Orden: distancia o ranking (`RESCUE_SUPPLIER_SORT_OPTIONS`).
- Componentes: `Map.vue`, `LocationPicker`, `MapPinPicker`, `MapPlacesSearch`, `SupplierStepMap`, `RescueSupplierMapLayout`.
- Convención de marcadores: AdvancedMarker (regla `google-maps-advanced-marker.mdc`).

## Geocoding (Nitro → n8n)

Tras sesión:

- `POST /api/maps/coords-to-address` body lat/lng (`parseGeocodingLatLng`).
- `POST /api/maps/link-to-coords` (link de Google Maps).

URLs n8n: `NUXT_N8N_COORDS_TO_ADDRESS_URL`, `NUXT_N8N_LINK_TO_COORDS_URL`. Utils: `app/utils/maps-geocoding.ts`, `maps-directions.ts`, `google-maps-link.ts`.

Clave pública de Maps: `NUXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
