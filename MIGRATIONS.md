# Migraciones de base de datos (Flyway)

Detalle de **identity**: `identity/doc/documentacion_identityervice.md` (sección 10).

## Servicios con Flyway

`identity`, `catalog`, `products`, `threads`: `spring.jpa.hibernate.ddl-auto: validate` + `spring.flyway.enabled: true` + `baseline-on-migrate` cuando la BD ya existía.

## Deploy

Las migraciones van **dentro de la imagen Docker** y Flyway las aplica **al arrancar** Spring Boot. No hay scripts de shell en el pipeline: solo build, push y `docker compose up` en la VM.
