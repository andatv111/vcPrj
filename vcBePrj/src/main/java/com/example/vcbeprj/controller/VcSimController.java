package com.example.vcbeprj.controller;

import com.example.vcbeprj.domain.PortalManualDrawing;
import com.example.vcbeprj.dto.VcSimCalculateRequest;
import com.example.vcbeprj.dto.VcSimSaveRequest;
import com.example.vcbeprj.service.PortalManualDrawingService;
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

    private final PortalManualDrawingService portalService;
    private final VcSimFacadeService simFacadeService;

    public VcSimController(PortalManualDrawingService portalService, VcSimFacadeService simFacadeService) {
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
                        "constructionNo", row.constructionNo(),
                        "label", row.eqId() + " (" + row.fab() + " / " + row.area1() + ")",
                        "raw", row
                ))
                .toList();
    }

    @GetMapping("/non-bim/manual-drawings")
    public List<PortalManualDrawing> manualDrawings(
            @RequestParam(required = false) String fab,
            @RequestParam String eqId,
            @RequestParam(required = false) String constructionNo
    ) {
        log.info("[API][GET /api/vc/sim/non-bim/manual-drawings] fab={} eqId={} constructionNo={}",
                fab, eqId, constructionNo);
        return portalService.searchManualDrawings(fab, eqId, constructionNo);
    }

    @GetMapping("/non-bim/chambers")
    public List<PortalManualDrawing.Chamber> drawingChambers(
            @RequestParam String eqId,
            @RequestParam String constructionNo
    ) {
        log.info("[API][GET /api/vc/sim/non-bim/chambers] eqId={} constructionNo={}", eqId, constructionNo);
        return portalService.getDrawingChambers(eqId, constructionNo);
    }

    @GetMapping("/non-bim/equipment-spec-options")
    public List<PortalManualDrawing.SpecOption> equipmentSpecOptions(
            @RequestParam(required = false) String eqId,
            @RequestParam(required = false) String fab,
            @RequestParam(required = false) String model,
            @RequestParam(required = false) String constructionNo
    ) {
        log.info("[API][GET /api/vc/sim/non-bim/equipment-spec-options] eqId={} fab={} model={} constructionNo={}",
                eqId, fab, model, constructionNo);
        return portalService.getEquipmentSpecOptions(eqId, fab, model, constructionNo);
    }

    @GetMapping("/non-bim/foreline-drawing/download")
    public ResponseEntity<byte[]> downloadForeline(
            @RequestParam String eqId,
            @RequestParam String constructionNo,
            @RequestParam(required = false) String drawingKey,
            @RequestParam(required = false) String fileId,
            @RequestParam(required = false) String fab
    ) {
        log.info("[API][GET /api/vc/sim/non-bim/foreline-drawing/download] eqId={} constructionNo={} drawingKey={} fileId={} fab={}",
                eqId, constructionNo, drawingKey, fileId, fab);
        PortalManualDrawing drawing = portalService.findByBusinessKey(eqId, constructionNo);
        String fileName = drawing.foreline() == null || drawing.foreline().fileName() == null
                ? eqId + "_" + constructionNo + "_Foreline.txt"
                : drawing.foreline().fileName();
        byte[] body = simFacadeService.buildForelineDownloadText(drawing).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(fileName, StandardCharsets.UTF_8).build().toString())
                .body(body);
    }

    @PostMapping("/non-bim/calculate")
    public Map<String, Object> calculateNonBim(@RequestBody VcSimCalculateRequest request) {
        log.info("[API][POST /api/vc/sim/non-bim/calculate] sourceType={} constructionNo={}",
                request.sourceType(), request.constructionNo());
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
