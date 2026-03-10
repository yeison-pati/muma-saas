# =========================
#   STAGE 1: BUILD
# =========================
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copiar solo POM y wrapper para cachear dependencias en una capa
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

# Descargar dependencias (solo re-ejecuta si cambia pom.xml)
RUN ./mvnw -q dependency:go-offline -B

# Copiar código fuente
COPY src ./src

# Compilar (reaprovecha dependencias ya descargadas)
RUN ./mvnw -q -DskipTests package

# Si usas Gradle en vez de Maven, reemplaza por:
# RUN ./gradlew bootJar --no-daemon


# =========================
#   STAGE 2: RUNTIME
# =========================
# Imagen ligera para ejecutar la app
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copiamos el JAR desde el builder
COPY --from=builder /app/target/*.jar app.jar

# Puerto interno del container
EXPOSE 8080

# Variables de entorno opcionales para entornos productivos
ENV JAVA_OPTS="-Xms256m -Xmx512m"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
