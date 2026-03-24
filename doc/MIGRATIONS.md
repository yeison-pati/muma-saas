# Versionado de esquema (Flyway) y deploy

Los servicios **identity**, **catalog**, **products** y **threads** ya usan **Flyway** + **Hibernate `ddl-auto: validate`**. Este documento define cómo versionar cambios de BD de forma segura y qué hacer con los **dumps** que ya generaste.

## Roles claros

| Herramienta | Rol |
|-------------|-----|
| **Flyway** | Única fuente de **cambios** al esquema en el tiempo (`V2__`, `V3__`, …). Se ejecuta **al arrancar** la aplicación Spring Boot, **antes** de que Hibernate valide las entidades. |
| **Hibernate** | Modelo en Java; con `validate` **no modifica** tablas. Si el esquema no coincide con las entidades, el arranque falla (fallo rápido). |
| **Dumps (`pg_dump`)** | **Referencia** del estado real del servidor y base para **nuevos entornos vacíos** o auditoría. No sustituyen el flujo incremental en producción. |

## ¿Incluir el esquema completo en el repo?

- **En migraciones Flyway (`db/migration/`)**:  
  - **Producción que ya existe**: **no** hace falta un `V1` gigante con todo el esquema. Con `baseline-on-migrate: true` y `baseline-version: 1`, Flyway **marca** la BD actual como “ya en versión 1” sin ejecutar scripts. Los cambios nuevos van en **`V2__`, `V3__`, …**  
  - **Entorno nuevo vacío** (CI, dev sin datos): ahí **sí** necesitas **un** script que cree el esquema inicial (o restaurar un dump una vez). Opciones:
    1. **Una sola migración** `V2__initial_schema.sql` generada a partir del dump **limpio** (quita a mano líneas `\restrict`/`\unrestrict` si vienen de pg_dump 17+), revisada a mano.
    2. O documentar: “primera vez: importar dump manualmente / Docker init”, y luego Flyway solo con `V3__` en adelante (menos ideal para “funcione a la primera” en CI).

- **Carpeta `dumps/`**: útil como **referencia** y diff; si contiene datos sensibles o solo quieres trazabilidad local, puedes **no** versionarla (`.gitignore`) y guardar dumps en un sitio seguro.

## Flujo recomendado (seguro y escalable)

1. **Cambio de modelo en Java** (nueva columna, tabla, índice…).
2. **Escribir una migración nueva** en **el servicio que posee esa base**, por ejemplo:
   - `catalog/src/main/resources/db/migration/V2__add_column_x.sql`
3. **Probar en local** contra una BD PostgreSQL (Docker) **clonada** o restaurada desde un dump reciente.
4. **Code review** del SQL (índices en tablas grandes, locks, `NOT NULL` sin default en tablas con datos).
5. **Staging**: deploy del JAR/imagen; Flyway aplica solo migraciones pendientes.
6. **Producción**: backup de BD → mismo artefacto; Flyway aplica lo pendiente; monitorear logs de arranque.

**Reglas:**

- **No editar** un archivo `Vn__*.sql` que **ya se aplicó** en prod (Flyway checksum). Cualquier corrección = **nueva** migración `V{n+1}__fix_*.sql`.
- Migraciones **pequeñas y atómicas** (una feature o un cambio de esquema coherente por archivo).
- **Rollback en datos**: si hace falta deshacer, nueva migración que revierta el cambio (no borrar historial Flyway).

## Orden en el deploy (Docker / servidor)

El orden correcto es el que ya da Spring Boot al iniciar el contenedor:

1. Arranque JVM → Flyway **migrate** → Hibernate **validate** → resto de la app.

No necesitas un paso extra en el pipeline **si** la app arranca con Flyway embebido. Solo asegúrate de que la variable de entorno apunte a la **misma** BD que usan los contenedores actuales (`DB_HOST`, `DB_NAME`, etc.).

## Primera vez en un servidor que **ya tiene** tablas (tu caso)

Configuración actual (ejemplo):

```yaml
spring.flyway.baseline-on-migrate: true
spring.flyway.baseline-version: 1
```

- Al desplegar la **primera** versión con Flyway, se crea `flyway_schema_history` y se registra el **baseline** en la versión **1** sin ejecutar `V1__`.
- Las migraciones reales deben llamarse **`V2__...sql`**, `V3__...`, etc.

Si en algún entorno la BD está **vacía**, el baseline no aplica igual: ahí Flyway ejecutará `V2`, `V3`, … desde cero; por eso conviene tener **un** `V2__initial_schema.sql` alineado con producción **o** un proceso documentado de restore.

## Preparar un dump de `pg_dump` 17 para Flyway

PostgreSQL 17 puede insertar líneas `\restrict` / `\unrestrict` que **no** son SQL estándar. Bórralas en el editor (o con `grep -v`) antes de pegar el contenido en un `.sql` de Flyway. Luego **revisa** el archivo (FKs, extensiones, nombres de esquema).

**Importante:** si **ya** usas baseline en prod, **no** subas un `V2` enorme que intente `CREATE TABLE` de todo lo que ya existe: en prod Flyway solo ejecutará migraciones con versión **> baseline** según el historial. Para **solo** entornos nuevos, a veces se usa un perfil o un script de init separado; la opción más simple en equipos pequeños es **un** `V2` idempotente solo donde haga falta (poco habitual) o **solo** migraciones incrementales y el esquema inicial documentado vía dump + restore manual en vacío.

## Resumen práctico

| Objetivo | Qué hacer |
|----------|-----------|
| Deploy seguro en **prod existente** | Baseline ya contemplado; añade solo **`V2__`, `V3__`** con ALTERs nuevos. |
| Dumps en disco | Referencia y generación de `V2` inicial para **vacío**; limpiar `\restrict`/`\unrestrict` si aplica; revisar a mano. |
| “Que funcione a la primera” | Probar migración en BD copia; logs de Flyway sin error; `ddl-auto: validate` OK. |
| Escalar el equipo | Una rama por cambio de esquema; PR del SQL + entidades; staging obligatorio antes de prod. |

## Comprobación rápida tras deploy

En PostgreSQL:

```sql
SELECT version, description, success, installed_on
FROM flyway_schema_history
ORDER BY installed_rank;
```

Si algo falla, el servicio **no** debería quedar “medio arrancado”: Falla el contexto y el orquestador (Docker/K8s) puede reiniciar; revisa logs de la app buscando `Flyway` / `Validate failed`.
