package com.example.vcbeprj.service;

import com.example.vcbeprj.domain.DesignPortalDrawing;
import com.example.vcbeprj.domain.SpecMaster;
import com.example.vcbeprj.repository.DesignPortalDrawingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
public class DesignPortalDrawingService {
    private static final Logger log = LoggerFactory.getLogger(DesignPortalDrawingService.class);
    private static final String PORTAL_TABLE = "DESIGN_PORTAL_MANUAL_DRAWING";

    private final DesignPortalDrawingRepository drawingRepository;
    private final VcSpecMasterService specMasterService;

    public DesignPortalDrawingService(DesignPortalDrawingRepository drawingRepository, VcSpecMasterService specMasterService) {
        this.drawingRepository = drawingRepository;
        this.specMasterService = specMasterService;
    }

    public List<DesignPortalDrawing> searchManualDrawings(String fabCd, String eqId, String woId) {
        log.info("[SERVICE][PORTAL][SELECT] business=searchManualDrawings table={} fabCd={} eqId={} woId={}",
                PORTAL_TABLE, fabCd, eqId, woId);
        // Design Portal is an external system, so preview keeps its query-shaped result in a separate TXT table.
        List<DesignPortalDrawing> rows = drawingRepository.findAll().stream()
                .filter(row -> isBlank(fabCd) || equalsIgnoreCase(row.fabCd(), fabCd))
                .filter(row -> isBlank(eqId) || containsIgnoreCase(row.eqId(), eqId))
                .filter(row -> isBlank(woId) || containsIgnoreCase(row.woId(), woId))
                .sorted(Comparator.comparing(DesignPortalDrawing::woId))
                .toList();
        log.info("[SERVICE][PORTAL][SELECT][DONE] resultCount={}", rows.size());
        return rows;
    }

    public List<DesignPortalDrawing> searchEquipmentSuggestions(String keyword) {
        log.info("[SERVICE][PORTAL][SELECT] business=searchEquipmentSuggestions table={} keyword={}", PORTAL_TABLE, keyword);
        return drawingRepository.findAll().stream()
                .filter(row -> isBlank(keyword) || containsIgnoreCase(row.eqId(), keyword))
                .sorted(Comparator.comparing(DesignPortalDrawing::eqId))
                .toList();
    }

    public DesignPortalDrawing findByBusinessKey(String eqId, String woId) {
        log.info("[SERVICE][PORTAL][SELECT] business=findByBusinessKey table={} eqId={} woId={}",
                PORTAL_TABLE, eqId, woId);
        return drawingRepository.findAll().stream()
                .filter(row -> equalsIgnoreCase(row.eqId(), eqId))
                .filter(row -> equalsIgnoreCase(row.woId(), woId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Design Portal drawing not found."));
    }

    public List<DesignPortalDrawing.Chamber> getDrawingChambers(String eqId, String woId) {
        log.info("[SERVICE][PORTAL][SELECT] business=getDrawingChambers table={} eqId={} woId={}",
                PORTAL_TABLE, eqId, woId);
        DesignPortalDrawing drawing = findByBusinessKey(eqId, woId);
        return drawing.chambers() == null ? List.of() : drawing.chambers();
    }

    public List<DesignPortalDrawing.SpecOption> getEquipmentSpecOptions(
            String eqId,
            String fabCd,
            String setModelNm,
            String woId
    ) {
        log.info("[SERVICE][PORTAL][SELECT] business=getEquipmentSpecOptions eqId={} fabCd={} setModelNm={} woId={}",
                eqId, fabCd, setModelNm, woId);
        DesignPortalDrawing drawing = isBlank(eqId) && isBlank(woId)
                ? null
                : drawingRepository.findAll().stream()
                        .filter(row -> isBlank(eqId) || equalsIgnoreCase(row.eqId(), eqId))
                        .filter(row -> isBlank(woId) || equalsIgnoreCase(row.woId(), woId))
                        .findFirst()
                        .orElse(null);

        if (drawing != null && drawing.specOptions() != null && !drawing.specOptions().isEmpty()) {
            log.info("[SERVICE][PORTAL][SELECT][DONE] source=designPortal optionCount={}", drawing.specOptions().size());
            return drawing.specOptions();
        }

        List<DesignPortalDrawing.SpecOption> options = specMasterService.getSpecByEquipmentCondition(fabCd, setModelNm).stream()
                .map(this::toSpecOption)
                .filter(Objects::nonNull)
                .toList();
        log.info("[SERVICE][PORTAL][SELECT][DONE] source=VCW_VC_SPEC_MST optionCount={}", options.size());
        return options;
    }

    public List<String> fabs() {
        List<String> portalFabs = drawingRepository.findAll().stream()
                .map(DesignPortalDrawing::fabCd)
                .filter(value -> !isBlank(value))
                .distinct()
                .sorted()
                .toList();
        if (!portalFabs.isEmpty()) return portalFabs;

        return specMasterService.getAllUsableSpecs().stream()
                .map(SpecMaster::fabId)
                .filter(value -> !isBlank(value))
                .distinct()
                .sorted()
                .toList();
    }

    public List<String> models() {
        return drawingRepository.findAll().stream()
                .map(DesignPortalDrawing::setModelNm)
                .filter(value -> !isBlank(value))
                .distinct()
                .sorted()
                .toList();
    }

    public List<SpecMaster> getAllUsableSpecs() {
        return specMasterService.getAllUsableSpecs();
    }

    private DesignPortalDrawing.SpecOption toSpecOption(SpecMaster spec) {
        if (spec == null) return null;
        return new DesignPortalDrawing.SpecOption(
                spec.chambModelNm(),
                spec.chambModelNm() + " / " + spec.specNm(),
                spec.specMinVal() == null ? "" : spec.specMinVal().stripTrailingZeros().toPlainString(),
                spec.specMaxVal() == null ? "" : spec.specMaxVal().stripTrailingZeros().toPlainString()
        );
    }

    private boolean containsIgnoreCase(String value, String keyword) {
        if (value == null || keyword == null) return false;
        return value.toLowerCase(Locale.ROOT).contains(keyword.toLowerCase(Locale.ROOT));
    }

    private boolean equalsIgnoreCase(String left, String right) {
        if (left == null || right == null) return false;
        return left.equalsIgnoreCase(right);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
