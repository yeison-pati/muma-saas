# MUMA Web - Frontend React

Frontend React puro (Vite) para el catálogo MUMA. Reemplaza la versión Expo/React Native Web.

## Stack

- **React 18** + **Vite 5**
- **React Router 6**
- **TanStack Query**
- **GraphQL** (catalog + identity)
- **Three.js** (visor 3D en `/viewer.html`)

## Desarrollo

```bash
npm install
npm run dev
```

Abre http://localhost:5173. El proxy envía `/api/*` a `http://localhost:8000` (Caddy).

## Build

```bash
npm run build
npm run preview
```

## Estructura

```
src/
├── api/           # GraphQL clients, queries, document service
├── components/    # BaseCard, BaseList, ProductDetailModal, Sidebar, etc.
├── context/       # UserContext, ProductsContext, FiltersContext, CartContext
├── hooks/         # useCatalogService
├── layouts/       # DashboardLayout (navbar + sidebar)
├── pages/         # Por rol: comercial, cotizador, disenador, admin
└── main.jsx
```

## Vistas por rol

| Rol       | Rutas                                      |
|-----------|---------------------------------------------|
| Comercial | Productos, Crear P3, Proyecto, Solicitudes  |
| Cotizador | Proyectos (filtros: consecutivo, cliente, estado) |
| Diseñador | Productos (editar/eliminar), Crear base     |
| Admin     | Proyectos (filtros), Usuarios               |

## Variables de entorno

- `VITE_API_BASE`: Base URL del API (por defecto vacío = rutas relativas con proxy)
