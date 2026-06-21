package com.example.vcbeprj.controller;

import com.example.vcbeprj.domain.SpecMaster;
import com.example.vcbeprj.service.VcSpecMasterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vc/specmaster")
public class VcSpecMasterController {
    private static final Logger log = LoggerFactory.getLogger(VcSpecMasterController.class);

    private final VcSpecMasterService specMasterService;

    public VcSpecMasterController(VcSpecMasterService specMasterService) {
        this.specMasterService = specMasterService;
    }

    @PostMapping("/search")
    public Map<String, Object> search(@RequestBody(required = false) Map<String, Object> payload) {
        Map<String, Object> body = payload == null ? Map.of() : payload;
        int page = number(body, "page", 0);
        int size = number(body, "size", 10);
        log.info("[API][POST /api/vc/specmaster/search] page={} size={} body={}", page, size, body);

        Map<String, Object> result = paging(
                specMasterService.searchMasters(
                        text(body, "fabId"),
                        text(body, "setModelNm"),
                        text(body, "specNm")
                ),
                page,
                size
        );

        @SuppressWarnings("unchecked")
        List<SpecMaster> masterRows = (List<SpecMaster>) result.get("rows");
        String requestedSpecId = text(body, "selectedSpecId");
        String selectedSpecId = masterRows.stream()
                .filter(row -> equalsText(row.specId(), requestedSpecId))
                .findFirst()
                .map(SpecMaster::specId)
                .orElse(masterRows.isEmpty() ? "" : masterRows.get(0).specId());

        result.put("selectedSpecId", selectedSpecId);
        result.put("details", selectedSpecId.isBlank() ? List.of() : specMasterService.getChildren(selectedSpecId));
        return result;
    }

    @PostMapping
    public SpecMaster createMaster(@RequestBody Map<String, Object> payload) {
        log.info("[API][POST /api/vc/specmaster]");
        return specMasterService.createMaster(payload);
    }

    @PostMapping("/selectexact")
    public List<SpecMaster> selectExact(@RequestBody(required = false) Map<String, Object> payload) {
        Map<String, Object> body = payload == null ? Map.of() : payload;
        log.info("[API][POST /api/vc/specmaster/selectexact] body={}", body);
        return specMasterService.searchAll(
                text(body, "fabId"),
                text(body, "setModelNm"),
                text(body, "operLargeCatgVal"),
                text(body, "operMidCatgVal"),
                text(body, "chambModelNm")
        );
    }

    @GetMapping("/selectfilteroptions")
    public Map<String, Object> selectFilterOptions() {
        log.info("[API][GET /api/vc/specmaster/selectfilteroptions]");
        return specMasterService.filterOptions();
    }

    @PatchMapping("/{specId}")
    public SpecMaster update(@PathVariable String specId, @RequestBody Map<String, Object> payload) {
        log.info("[API][PATCH /api/vc/specmaster/{}]", specId);
        return specMasterService.update(specId, payload);
    }

    @DeleteMapping("/{specId}")
    public Map<String, Object> delete(@PathVariable String specId) {
        log.info("[API][DELETE /api/vc/specmaster/{}]", specId);
        int deletedCount = specMasterService.delete(specId);
        return Map.of("deletedCount", deletedCount);
    }

    @GetMapping("/{specId}/children")
    public List<SpecMaster> children(@PathVariable String specId) {
        log.info("[API][GET /api/vc/specmaster/{}/children]", specId);
        return specMasterService.getChildren(specId);
    }

    @PostMapping("/{specId}/children")
    public SpecMaster createChild(@PathVariable String specId, @RequestBody Map<String, Object> payload) {
        log.info("[API][POST /api/vc/specmaster/{}/children]", specId);
        return specMasterService.createChild(specId, payload);
    }

    private Map<String, Object> paging(List<SpecMaster> allRows, int page, int size) {
        int safeSize = Math.max(size, 1);
        int safePage = Math.max(page, 0);
        int from = Math.min(safePage * safeSize, allRows.size());
        int to = Math.min(from + safeSize, allRows.size());
        List<SpecMaster> content = allRows.subList(from, to);
        int totalPages = Math.max(1, (int) Math.ceil((double) allRows.size() / safeSize));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", content);
        result.put("rows", content);
        result.put("number", safePage);
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("totalPages", totalPages);
        result.put("totalElements", allRows.size());
        return result;
    }

    private String text(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        return value == null ? "" : String.valueOf(value);
    }

    private int number(Map<String, Object> payload, String key, int fallback) {
        Object value = payload.get(key);
        if (value == null) return fallback;
        if (value instanceof Number number) return number.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }

    private boolean equalsText(String left, String right) {
        return left != null && right != null && left.equalsIgnoreCase(right);
    }
}
