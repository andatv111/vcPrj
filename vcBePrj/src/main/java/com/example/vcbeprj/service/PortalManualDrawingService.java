package com.example.vcbeprj.service;

import com.example.vcbeprj.domain.PortalManualDrawing;
import com.example.vcbeprj.domain.SpecMaster;
import com.example.vcbeprj.repository.TxtTableRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
public class PortalManualDrawingService {
    private static final Logger log = LoggerFactory.getLogger(PortalManualDrawingService.class);
    private static final String PORTAL_TABLE = "VC_PORTAL_MANUAL_DRAWING";

    private final TxtTableRepository repository;
    private final VcSpecMasterService specMasterService;

    public PortalManualDrawingService(TxtTableRepository repository, VcSpecMasterService specMasterService) {
        this.repository = repository;
        this.specMasterService = specMasterService;
    }

    public List<PortalManualDrawing> searchManualDrawings(String fab, String eqId, String constructionNo) {
        log.info("[SERVICE][PORTAL][SELECT] business=searchManualDrawings table={} fab={} eqId={} constructionNo={}",
                PORTAL_TABLE, fab, eqId, constructionNo);
        // TODO: 설계포탈 조회 쿼리가 확정되면 이 TXT table select를 실제 portal query mapper로 교체합니다.
        List<PortalManualDrawing> rows = repository.selectAll(PORTAL_TABLE, PortalManualDrawing.class).stream()
                .filter(row -> isBlank(fab) || equalsIgnoreCase(row.fab(), fab))
                .filter(row -> isBlank(eqId) || containsIgnoreCase(row.eqId(), eqId))
                .filter(row -> isBlank(constructionNo) || containsIgnoreCase(row.constructionNo(), constructionNo))
                .sorted(Comparator.comparing(PortalManualDrawing::constructionNo))
                .toList();
        log.info("[SERVICE][PORTAL][SELECT][DONE] resultCount={}", rows.size());
        return rows;
    }

    public List<PortalManualDrawing> searchEquipmentSuggestions(String keyword) {
        log.info("[SERVICE][PORTAL][SELECT] business=searchEquipmentSuggestions table={} keyword={}", PORTAL_TABLE, keyword);
        return repository.selectAll(PORTAL_TABLE, PortalManualDrawing.class).stream()
                .filter(row -> isBlank(keyword) || containsIgnoreCase(row.eqId(), keyword))
                .sorted(Comparator.comparing(PortalManualDrawing::eqId))
                .toList();
    }

    public PortalManualDrawing findByBusinessKey(String eqId, String constructionNo) {
        log.info("[SERVICE][PORTAL][SELECT] business=findByBusinessKey table={} eqId={} constructionNo={}",
                PORTAL_TABLE, eqId, constructionNo);
        return repository.selectAll(PORTAL_TABLE, PortalManualDrawing.class).stream()
                .filter(row -> equalsIgnoreCase(row.eqId(), eqId))
                .filter(row -> equalsIgnoreCase(row.constructionNo(), constructionNo))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Foreline drawing not found."));
    }

    public List<PortalManualDrawing.Chamber> getDrawingChambers(String eqId, String constructionNo) {
        log.info("[SERVICE][PORTAL][SELECT] business=getDrawingChambers table={} eqId={} constructionNo={}",
                PORTAL_TABLE, eqId, constructionNo);
        // 현재 개발 원천은 data/VC_PORTAL_MANUAL_DRAWING.txt의 chambers[].chamberName입니다.
        // 운영 전환 시 이 메서드의 조회만 설계포탈 Chamber 매핑 쿼리로 교체합니다.
        PortalManualDrawing drawing = findByBusinessKey(eqId, constructionNo);
        return drawing.chambers() == null ? List.of() : drawing.chambers();
    }

    public List<PortalManualDrawing.SpecOption> getEquipmentSpecOptions(
            String eqId,
            String fab,
            String model,
            String constructionNo
    ) {
        log.info("[SERVICE][PORTAL][SELECT] business=getEquipmentSpecOptions eqId={} fab={} model={} constructionNo={}",
                eqId, fab, model, constructionNo);
        // Radio click uses EQ ID + constructionNo first. Add lineId/revision/etc. here when B/E keys expand.
        PortalManualDrawing drawing = isBlank(eqId) && isBlank(constructionNo)
                ? null
                : repository.selectAll(PORTAL_TABLE, PortalManualDrawing.class).stream()
                        .filter(row -> isBlank(eqId) || equalsIgnoreCase(row.eqId(), eqId))
                        .filter(row -> isBlank(constructionNo) || equalsIgnoreCase(row.constructionNo(), constructionNo))
                        .findFirst()
                        .orElse(null);

        if (drawing != null && drawing.specOptions() != null && !drawing.specOptions().isEmpty()) {
            log.info("[SERVICE][PORTAL][SELECT][DONE] source=portalDrawing optionCount={}", drawing.specOptions().size());
            return drawing.specOptions();
        }

        List<PortalManualDrawing.SpecOption> options = specMasterService.getSpecByEquipmentCondition(fab, model).stream()
                .map(this::toSpecOption)
                .filter(Objects::nonNull)
                .toList();
        log.info("[SERVICE][PORTAL][SELECT][DONE] source=VCW_VC_SPEC_MST optionCount={}", options.size());
        return options;
    }

    public List<String> fabs() {
        return repository.selectAll(PORTAL_TABLE, PortalManualDrawing.class).stream()
                .map(PortalManualDrawing::fab)
                .filter(value -> !isBlank(value))
                .distinct()
                .sorted()
                .toList();
    }

    public List<String> models() {
        return repository.selectAll(PORTAL_TABLE, PortalManualDrawing.class).stream()
                .map(PortalManualDrawing::model)
                .filter(value -> !isBlank(value))
                .distinct()
                .sorted()
                .toList();
    }

    private PortalManualDrawing.SpecOption toSpecOption(SpecMaster spec) {
        if (spec == null) return null;
        return new PortalManualDrawing.SpecOption(
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
