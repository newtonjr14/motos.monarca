FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY gradlew settings.gradle.kts build.gradle.kts ./
COPY gradle gradle
COPY src src
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew \
    && ./gradlew installDist -x test --no-daemon \
        -Dorg.gradle.java.installations.auto-download=false

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /src/build/install/motos.api /app
EXPOSE 8080
ENTRYPOINT ["/app/bin/motos.api", "-config=/config/application.yaml"]
