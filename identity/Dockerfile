# =========================
#   STAGE 1: BUILD
# =========================
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copiamos todo el código del backend
COPY . .

# Construimos el JAR (usa Maven o Gradle, ajusta según tu proyecto)
# Para Maven:
RUN ./mvnw -q -DskipTests clean package

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
