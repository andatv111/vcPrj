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
import org.springframework.web.bind.annotation.RequestParam;
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

    @PostMapping
    public SpecMaster createMaster(@RequestBody Map<String, Object> payload) {
        log.info("[API][POST /api/vc/specmaster]");
        return specMasterService.createMaster(payload);
    }

    @GetMapping("/selectpaging")
    public Map<String, Object> selectPaging(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        // GoodDocs 전체조회 API입니다. 현재 SpecMaster 화면의 좌측 grid는 selectleftpaging을 사용하지만,
        // B/E 협의와 전체 데이터 확인을 위해 Master/Detail 전체 paging API도 유지합니다.
        log.info("[API][GET /api/vc/specmaster/selectpaging] page={} size={}", page, size);
        return paging(specMasterService.searchAll("", "", "", "", ""), page, size);
    }

    @PostMapping("/selectpaging")
    public Map<String, Object> selectPagingByCondition(
            @RequestBody(required = false) Map<String, Object> payload,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Map<String, Object> body = payload == null ? Map.of() : payload;
        // Detail 성격의 공정/Chamber 조건까지 포함한 조건조회입니다.
        // 좌측 Master grid 검색 조건과는 다르므로 F/E 기본 조회에는 사용하지 않습니다.
        log.info("[API][POST /api/vc/specmaster/selectpaging] page={} size={} body={}", page, size, body);
        return paging(specMasterService.searchAll(
                text(body, "fabId"),
                text(body, "setModelNm"),
                text(body, "operLargeCatgVal"),
                text(body, "operMidCatgVal"),
                text(body, "chambModelNm")
        ), page, size);
    }

    @GetMapping("/selectleftpaging")
    public Map<String, Object> selectLeftPaging(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String fabId,
            @RequestParam(required = false) String setModelNm,
            @RequestParam(required = false) String specNm
    ) {
        // SpecMaster 좌측 Master Grid 전용 API입니다.
        // Service에서 upperCd가 비어 있는 상위 Spec만 골라 paging합니다.
        log.info("[API][GET /api/vc/specmaster/selectleftpaging] page={} size={} fabId={} setModelNm={} specNm={}",
                page, size, fabId, setModelNm, specNm);
        return paging(specMasterService.searchMasters(fabId, setModelNm, specNm), page, size);
    }

    @PostMapping("/selectexact")
    public List<SpecMaster> selectExact(@RequestBody(required = false) Map<String, Object> payload) {
        Map<String, Object> body = payload == null ? Map.of() : payload;
        // GoodDocs의 exact 조회입니다. 현재 화면 기본 조회에는 쓰지 않지만,
        // 저장 전 중복 체크나 계산 판정용 후보 조회로 확장할 수 있어 endpoint를 보존합니다.
        log.info("[API][POST /api/vc/specmaster/selectexact] body={}", body);
        return specMasterService.searchAll(
                text(body, "fabId"),
                text(body, "setModelNm"),
                text(body, "operLargeCatgVal"),
                text(body, "operMidCatgVal"),
                text(body, "chambModelNm")
        );
    }

    @GetMapping("/selectcondition")
    public List<SpecMaster> selectCondition(
            @RequestParam(required = false) String fabId,
            @RequestParam(required = false) String setModelNm,
            @RequestParam(required = false) String specNm
    ) {
        log.info("[API][GET /api/vc/specmaster/selectcondition] fabId={} setModelNm={} specNm={}", fabId, setModelNm, specNm);
        return specMasterService.searchMasters(fabId, setModelNm, specNm);
    }

    @GetMapping("/selectfilteroptions")
    public Map<String, Object> selectFilterOptions() {
        log.info("[API][GET /api/vc/specmaster/selectfilteroptions]");
        return specMasterService.filterOptions();
    }

    @GetMapping("/{specId}")
    public SpecMaster getById(@PathVariable String specId) {
        log.info("[API][GET /api/vc/specmaster/{}]", specId);
        return specMasterService.getById(specId)
                .orElseThrow(() -> new IllegalArgumentException("Spec Master row not found: " + specId));
    }

    @PatchMapping("/{specId}")
    public SpecMaster update(@PathVariable String specId, @RequestBody Map<String, Object> payload) {
        log.info("[API][PATCH /api/vc/specmaster/{}]", specId);
        return specMasterService.update(specId, payload);
    }

    @DeleteMapping("/{specId}")
    public Map<String, Object> delete(@PathVariable String specId, @RequestParam(required = false) String chgchgrempno) {
        log.info("[API][DELETE /api/vc/specmaster/{}] chgchgrempno={}", specId, chgchgrempno);
        int deletedCount = specMasterService.delete(specId);
        return Map.of("deletedCount", deletedCount);
    }

    @GetMapping("/{specId}/children")
    public List<SpecMaster> getChildren(@PathVariable String specId) {
        // GoodDocs의 children 조회는 POST로도 적혀 있었지만 조회 성격이므로 GET endpoint를 명확히 제공합니다.
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
        // F/E가 Spring paging 스타일(content)과 기존 grid 스타일(rows)을 모두 받을 수 있게 둘 다 제공합니다.
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
}
