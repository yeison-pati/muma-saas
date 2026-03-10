# Identity & Auth Service – Documentación Técnica

## 1. Visión General
Este módulo implementa un **servicio de identidad y autenticación** basado en **Spring WebFlux**, **JWT (RSA)** y **PostgreSQL**. Centraliza:

- Gestión de usuarios
- Autenticación (login)
- Autorización por roles
- Métricas específicas por rol (Sales, Quoter, Designer)

El servicio actúa como **Auth Server + Resource Server** para el ecosistema de microservicios.

---

## 2. Base de Datos

### 2.1 Extensión
Se utiliza UUID como identificador principal:

- `uuid-ossp`

---

### 2.2 Tabla `users`
Tabla principal de identidad.

| Campo | Tipo | Descripción |
|-----|-----|------------|
| id | UUID | PK, generado automáticamente |
| name | VARCHAR(150) | Nombre completo |
| email | VARCHAR(150) | Único, usado para login |
| phone | VARCHAR(50) | Teléfono |
| password | TEXT | Password encriptado (BCrypt) |
| role | VARCHAR(50) | Rol principal (ADMIN, SALES, QUOTER, DESIGNER) |
| region | VARCHAR(100) | Región / sede |
| job_title | VARCHAR(150) | Cargo |
| created_at | TIMESTAMP | Fecha creación |
| updated_at | TIMESTAMP | Fecha actualización |
| created_by | VARCHAR(150) | Usuario creador |
| updated_by | VARCHAR(150) | Usuario editor |

Índices:
- `idx_users_email`

---

### 2.3 Tabla `sales`
Métricas específicas del rol **SALES**.

| Campo | Tipo | Descripción |
|-----|-----|------------|
| id | UUID | PK |
| user_id | UUID | FK → users(id) |
| requested | INTEGER | Solicitudes realizadas |
| effective | INTEGER | Ventas efectivas |

Relación:
- `ON DELETE CASCADE`

---

### 2.4 Tabla `quoters`
Métricas del rol **QUOTER**.

| Campo | Tipo | Descripción |
|-----|-----|------------|
| id | UUID | PK |
| user_id | UUID | FK → users(id) |
| quoted | INTEGER | Cotizaciones |
| projects | INTEGER | Proyectos |
| products | INTEGER | Productos |

---

### 2.5 Tabla `designers`
Métricas del rol **DESIGNER**.

| Campo | Tipo | Descripción |
|-----|-----|------------|
| id | UUID | PK |
| user_id | UUID | FK → users(id) |
| created | INTEGER | Diseños creados |
| edited | INTEGER | Diseños editados |

---

## 3. Seguridad

### 3.1 Esquema de Autenticación
- JWT firmado con **RSA 2048**
- Claves generadas en memoria (`KeyPairGenerator`)
- Algoritmo: RS256

### 3.2 Claims del JWT

| Claim | Descripción |
|------|------------|
| iss | Emisor |
| aud | Audiencia (`api-muma`) |
| sub | userId (UUID) |
| roles | Lista de roles del usuario |
| iat | Issued at |
| exp | Expira en 15 minutos |

Ejemplo:
```
{
  "sub": "uuid",
  "roles": ["ADMIN"]
}
```

---

### 3.3 Conversión de Roles
El claim `roles` se transforma automáticamente a autoridades Spring:

```
ROLE_ADMIN
ROLE_SALES
ROLE_QUOTER
ROLE_DESIGNER
```

---

## 4. Endpoints

### 4.1 Autenticación

#### POST `/auth/signin`
Login de usuario.

**Request**
```
{
  "email": "user@mail.com",
  "password": "1234"
}
```

**Response**
```
{
  "token": "jwt"
}
```

---

### 4.2 Admin (`ROLE_ADMIN`)

#### GET `/admin`
Obtiene información del admin autenticado.

#### PATCH `/admin`
Actualiza su información.

#### POST `/admin/users`
Crea un usuario y su entidad asociada según el rol.

Roles soportados:
- QUOTER → crea registro en `quoters`
- SALES → crea registro en `sales`
- DESIGNER → crea registro en `designers`

#### PATCH `/admin/users/{userId}`
Edita usuario.

#### POST `/admin/users/{UserId}`
Elimina usuario y entidades relacionadas.

---

### 4.3 Usuario autenticado (`/me`)

#### QUOTER
- GET `/me/quoter`
- PATCH `/me/quoter`

#### SALES
- GET `/me/sales`
- PATCH `/me/sales`

#### DESIGNER
- GET `/me/designer`
- PATCH `/me/designer`

Cada endpoint devuelve:
- Datos base del usuario
- Métricas específicas del rol

---

## 5. Servicios

### JwtService
Responsable de generar el JWT.

### AuthService
- Valida credenciales
- Genera token

### AdminService
- CRUD de usuarios
- Manejo de entidades por rol

### UserService
- Lectura y actualización de métricas por rol

---

## 6. Modelo Reactivo

- Spring WebFlux
- Retornos `Mono<T>`
- Flujo no bloqueante

---

## 7. Consideraciones

- Un usuario tiene **un solo rol principal**
- El token expira en **15 minutos**
- El resto de microservicios solo validan JWT (public key)
- Identity es el **único servicio que firma tokens**

---

## 8. Usuario Inicial

Se inserta un ADMIN por defecto:

- Email: `yeisonstivnpm@gmail.com`
- Password: `1234`

(Password almacenado en BCrypt)

---

## 9. Posibles Mejoras

- Refresh tokens
- Persistencia de claves RSA
- Auditoría (created_by / updated_by automático)
- Soporte multi-rol

---

**Fin del documento**

