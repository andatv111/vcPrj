package com.example.vcbeprj.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Component
public class StartupLogRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(StartupLogRunner.class);

    private final MockDbProperties properties;

    public StartupLogRunner(MockDbProperties properties) {
        this.properties = properties;
    }

    @Override
    public void run(ApplicationArguments args) throws IOException {
        Path basePath = Path.of(properties.getBasePath()).toAbsolutePath().normalize();
        log.info("[BOOT] vcBePrj started. mockDbBasePath={}", basePath);

        if (!Files.exists(basePath)) {
            log.warn("[BOOT][MOCK_DB] base path does not exist yet. It will be created on first table access.");
            return;
        }

        try (var stream = Files.list(basePath)) {
            stream
                    .filter(path -> path.getFileName().toString().endsWith(".txt"))
                    .sorted()
                    .forEach(path -> log.info("[BOOT][MOCK_DB] tableFile={}", path.toAbsolutePath().normalize()));
        }
    }
}
