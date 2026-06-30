package com.example.vcbeprj.controller;

import com.example.vcbeprj.domain.SpecMaster;
import com.example.vcbeprj.service.VcSpecMasterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

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

    @PostMapping("/selectcondition")
    public Map<String, Object> selectCondition(@RequestBody(required = false) Map<String, Object> payload) {
        Map<String, Object> body = payload == null ? Map.of() : payload;
        log.info("[API][POST /api/vc/specmaster/selectcondition] body={}", body);

        List<SpecMaster> searchedMasters = specMasterService.searchMasters(
                text(body, "fabId"),
                text(body, "setModelNm"),
                text(body, "specNm")
        );
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("rows", searchedMasters);
        result.put("details", specMasterService.getChildrenForMasters(searchedMasters));
        result.put("totalElements", searchedMasters.size());
        result.put("totalPages", searchedMasters.isEmpty() ? 0 : 1);
        result.put("selectedSpecId", searchedMasters.isEmpty() ? "" : searchedMasters.get(0).specId());
        return result;
    }

    @GetMapping("/selectfilteroptions")
    public Map<String, Object> selectFilterOptions() {
        log.info("[API][GET /api/vc/specmaster/selectfilteroptions]");
        return specMasterService.filterOptions();
    }

    @GetMapping("/specnames")
    public List<Map<String, String>> specNameSuggestions(@RequestParam(required = false) String keyword) {
        log.info("[API][GET /api/vc/specmaster/specnames] keyword={}", keyword);
        return specMasterService.searchSpecNameSuggestions(keyword);
    }

    @PostMapping
    public SpecMaster createMaster(@RequestBody Map<String, Object> payload) {
        log.info("[API][POST /api/vc/specmaster]");
        return specMasterService.createMaster(payload);
    }

    @GetMapping("/{specId}")
    public SpecMaster findById(@PathVariable String specId) {
        log.info("[API][GET /api/vc/specmaster/{}]", specId);
        return specMasterService.getById(specId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Spec Master row not found: " + specId));
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

    @PatchMapping("/{specId}")
    public SpecMaster update(@PathVariable String specId, @RequestBody Map<String, Object> payload) {
        log.info("[API][PATCH /api/vc/specmaster/{}]", specId);
        return specMasterService.update(specId, payload);
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

    @GetMapping("/selectcondition")
    public void selectConditionGetNotSupported() {
        throw new ResponseStatusException(HttpStatus.METHOD_NOT_ALLOWED, "Use POST /api/vc/specmaster/selectcondition");
    }

    @RequestMapping({"/selectpaging", "/selectleftpaging"})
    public void legacyPagingEndpointsNotSupported() {
        throw new ResponseStatusException(HttpStatus.METHOD_NOT_ALLOWED, "Use POST /api/vc/specmaster/selectcondition");
    }

    private String text(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        return value == null ? "" : String.valueOf(value);
    }

}
