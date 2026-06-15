package com.example.vcbeprj.controller;

import com.example.vcbeprj.domain.DesignPortalDrawing;
import com.example.vcbeprj.dto.VcSimCalculateRequest;
import com.example.vcbeprj.dto.VcSimSaveRequest;
import com.example.vcbeprj.service.DesignPortalDrawingService;
import com.example.vcbeprj.service.VcSimFacadeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vc/sim")
public class VcSimController {
    private static final Logger log = LoggerFactory.getLogger(VcSimController.class);

    private final DesignPortalDrawingService portalService;
    private final VcSimFacadeService simFacadeService;

    public VcSimController(DesignPortalDrawingService portalService, VcSimFacadeService simFacadeService) {
        this.portalService = portalService;
        this.simFacadeService = simFacadeService;
    }

    @GetMapping("/non-bim/options")
    public Map<String, Object> nonBimOptions() {
        log.info("[API][GET /api/vc/sim/non-bim/options]");
        return simFacadeService.nonBimOptions();
    }

    @GetMapping("/non-bim/equipments")
    public List<Map<String, Object>> equipments(@RequestParam(required = false) String keyword) {
        log.info("[API][GET /api/vc/sim/non-bim/equipments] keyword={}", keyword);
        return portalService.searchEquipmentSuggestions(keyword).stream()
                .map(row -> Map.<String, Object>of(
                        "eqId", row.eqId(),
                        "woId", row.woId(),
                        "label", row.eqId() + " (" + row.fabCd() + " / " + row.area() + ")",
                        "raw", row
                ))
                .toList();
    }

    @GetMapping("/non-bim/manual-drawings")
    public List<DesignPortalDrawing> manualDrawings(
            @RequestParam(required = false) String fabCd,
            @RequestParam String eqId,
            @RequestParam(required = false) String woId
    ) {
        log.info("[API][GET /api/vc/sim/non-bim/manual-drawings] fabCd={} eqId={} woId={}",
                fabCd, eqId, woId);
        return portalService.searchManualDrawings(fabCd, eqId, woId);
    }

    @GetMapping("/non-bim/chambers")
    public List<DesignPortalDrawing.Chamber> drawingChambers(
            @RequestParam String eqId,
            @RequestParam String woId
    ) {
        log.info("[API][GET /api/vc/sim/non-bim/chambers] eqId={} woId={}", eqId, woId);
        return portalService.getDrawingChambers(eqId, woId);
    }

    @GetMapping("/non-bim/equipment-spec-options")
    public List<DesignPortalDrawing.SpecOption> equipmentSpecOptions(
            @RequestParam(required = false) String eqId,
            @RequestParam(required = false) String fabCd,
            @RequestParam(required = false) String setModelNm,
            @RequestParam(required = false) String woId
    ) {
        log.info("[API][GET /api/vc/sim/non-bim/equipment-spec-options] eqId={} fabCd={} setModelNm={} woId={}",
                eqId, fabCd, setModelNm, woId);
        return portalService.getEquipmentSpecOptions(eqId, fabCd, setModelNm, woId);
    }

    @GetMapping("/non-bim/foreline-drawing/download")
    public ResponseEntity<byte[]> downloadForeline(
            @RequestParam String eqId,
            @RequestParam String woId,
            @RequestParam(required = false) String file,
            @RequestParam(required = false) String fileSeq,
            @RequestParam(required = false) String fabCd
    ) {
        log.info("[API][GET /api/vc/sim/non-bim/foreline-drawing/download] eqId={} woId={} file={} fileSeq={} fabCd={}",
                eqId, woId, file, fileSeq, fabCd);
        DesignPortalDrawing drawing = portalService.findByBusinessKey(eqId, woId);
        String fileName = drawing.fileNm() == null || drawing.fileNm().isBlank()
                ? eqId + "_" + woId + "_Foreline.txt"
                : drawing.fileNm();
        byte[] body = simFacadeService.buildForelineDownloadText(drawing).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(fileName, StandardCharsets.UTF_8).build().toString())
                .body(body);
    }

    @PostMapping("/non-bim/calculate")
    public Map<String, Object> calculateNonBim(@RequestBody VcSimCalculateRequest request) {
        log.info("[API][POST /api/vc/sim/non-bim/calculate] sourceType={} woId={}",
                request.sourceType(), request.woId());
        return simFacadeService.calculate(request);
    }

    @GetMapping("/calculator/options")
    public Map<String, Object> calculatorOptions() {
        log.info("[API][GET /api/vc/sim/calculator/options]");
        return simFacadeService.calculatorOptions();
    }

    @PostMapping("/calculator/calculate")
    public Map<String, Object> calculateCalculator(@RequestBody VcSimCalculateRequest request) {
        log.info("[API][POST /api/vc/sim/calculator/calculate] sourceType={}", request.sourceType());
        return simFacadeService.calculate(request);
    }

    @PostMapping("/result/save")
    public Map<String, Object> saveResult(@RequestBody VcSimSaveRequest request) {
        log.info("[API][POST /api/vc/sim/result/save] sourceType={}", request.sourceType());
        return simFacadeService.saveResult(request);
    }
}
