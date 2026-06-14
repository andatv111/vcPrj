package com.example.vcbeprj.repository;

import com.example.vcbeprj.config.MockDbProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Predicate;

@Repository
public class TxtTableRepository {
    private static final Logger log = LoggerFactory.getLogger(TxtTableRepository.class);

    private final MockDbProperties properties;
    private final ObjectMapper objectMapper;

    public TxtTableRepository(MockDbProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public synchronized <T> List<T> selectAll(String tableName, Class<T> rowType) {
        Path path = tablePath(tableName);
        ensureTable(path);

        try {
            List<T> rows = new ArrayList<>();
            for (String line : Files.readAllLines(path, StandardCharsets.UTF_8)) {
                if (!line.isBlank()) {
                    rows.add(objectMapper.readValue(line, rowType));
                }
            }
            log.debug("[TXT_DB][SELECT] table={} file={} rowType={} rowCount={}", tableName, path.toAbsolutePath().normalize(), rowType.getSimpleName(), rows.size());
            return rows;
        } catch (IOException e) {
            log.error("[TXT_DB][SELECT][FAIL] table={} file={}", tableName, path.toAbsolutePath().normalize(), e);
            throw new IllegalStateException("Failed to read mock table: " + tableName, e);
        }
    }

    public synchronized <T> void insert(String tableName, T row) {
        log.info("[TXT_DB][INSERT] table={} rowType={} row={}", tableName, row.getClass().getSimpleName(), row);
        List<T> rows = selectAll(tableName, rowType(row));
        rows.add(row);
        overwrite(tableName, rows);
    }

    public synchronized <T> void insertAll(String tableName, List<T> newRows) {
        if (newRows.isEmpty()) return;
        log.info("[TXT_DB][INSERT_ALL] table={} rowType={} insertCount={}", tableName, newRows.get(0).getClass().getSimpleName(), newRows.size());
        List<T> rows = selectAll(tableName, rowType(newRows.get(0)));
        rows.addAll(newRows);
        overwrite(tableName, rows);
    }

    public synchronized <T> int deleteWhere(String tableName, Class<T> rowType, Predicate<T> predicate) {
        log.info("[TXT_DB][DELETE] table={} rowType={}", tableName, rowType.getSimpleName());
        List<T> rows = selectAll(tableName, rowType);
        int before = rows.size();
        rows.removeIf(predicate);
        overwrite(tableName, rows);
        log.info("[TXT_DB][DELETE][DONE] table={} deletedCount={} remainCount={}", tableName, before - rows.size(), rows.size());
        return before - rows.size();
    }

    public synchronized <T> int updateWhere(String tableName, Class<T> rowType, Predicate<T> predicate, RowUpdater<T> updater) {
        log.info("[TXT_DB][UPDATE] table={} rowType={}", tableName, rowType.getSimpleName());
        List<T> rows = selectAll(tableName, rowType);
        int count = 0;
        List<T> updatedRows = new ArrayList<>();
        for (T row : rows) {
            if (predicate.test(row)) {
                updatedRows.add(updater.update(row));
                count++;
            } else {
                updatedRows.add(row);
            }
        }
        overwrite(tableName, updatedRows);
        log.info("[TXT_DB][UPDATE][DONE] table={} updatedCount={} totalCount={}", tableName, count, updatedRows.size());
        return count;
    }

    private <T> void overwrite(String tableName, List<T> rows) {
        Path path = tablePath(tableName);
        ensureTable(path);

        try {
            List<String> lines = new ArrayList<>();
            for (T row : rows) {
                lines.add(objectMapper.writeValueAsString(row));
            }
            Files.write(path, lines, StandardCharsets.UTF_8);
            log.debug("[TXT_DB][WRITE] table={} file={} rowCount={}", tableName, path.toAbsolutePath().normalize(), rows.size());
        } catch (IOException e) {
            log.error("[TXT_DB][WRITE][FAIL] table={} file={}", tableName, path.toAbsolutePath().normalize(), e);
            throw new IllegalStateException("Failed to write mock table: " + tableName, e);
        }
    }

    private Path tablePath(String tableName) {
        return Path.of(properties.getBasePath()).resolve(tableName + ".txt");
    }

    private void ensureTable(Path path) {
        try {
            Files.createDirectories(path.getParent());
            if (!Files.exists(path)) {
                Files.createFile(path);
                log.info("[TXT_DB][CREATE_TABLE_FILE] file={}", path.toAbsolutePath().normalize());
            }
        } catch (IOException e) {
            log.error("[TXT_DB][INIT][FAIL] file={}", path.toAbsolutePath().normalize(), e);
            throw new IllegalStateException("Failed to initialize mock table: " + path, e);
        }
    }

    @SuppressWarnings("unchecked")
    private <T> Class<T> rowType(T row) {
        return (Class<T>) row.getClass();
    }

    @FunctionalInterface
    public interface RowUpdater<T> {
        T update(T row);
    }
}
