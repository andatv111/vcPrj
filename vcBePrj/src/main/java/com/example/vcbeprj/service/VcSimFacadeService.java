package com.example.vcbeprj.service;

import com.example.vcbeprj.domain.JudgeResult;
import com.example.vcbeprj.domain.ObjectType;
import com.example.vcbeprj.domain.PortalManualDrawing;
import com.example.vcbeprj.domain.SpecMaster;
import com.example.vcbeprj.dto.CalculateRequest;
import com.example.vcbeprj.dto.CalculateResponse;
import com.example.vcbeprj.dto.ChamberInput;
import com.example.vcbeprj.dto.ChamberResultResponse;
import com.example.vcbeprj.dto.ObjectInput;
import com.example.vcbeprj.dto.VcSimCalculateRequest;
import com.example.vcbeprj.dto.VcSimResultRow;
import com.example.vcbeprj.dto.VcSimSaveRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Arrays;

@Service
public class VcSimFacadeService {
    private static final Logger log = LoggerFactory.getLogger(VcSimFacadeService.class);

    private final VcCalculationService calculationService;
    private final PortalManualDrawingService portalService;

    public VcSimFacadeService(VcCalculationService calculationService, PortalManualDrawingService portalService) {
        this.calculationService = calculationService;
        this.portalService = portalService;
    }

    public Map<String, Object> nonBimOptions() {
        log.info("[SERVICE][SIM][OPTIONS] business=nonBimOptions");
        return Map.of(
                "fabs", portalService.fabs().stream().map(this::option).toList(),
                "pipeTypes", pipeTypeOptions()
        );
    }

    public Map<String, Object> calculatorOptions() {
        log.info("[SERVICE][SIM][OPTIONS] business=calculatorOptions");
        return Map.of(
                "fabs", portalService.fabs().stream().map(this::option).toList(),
                "models", portalService.models().stream().map(this::option).toList(),
                "modelStandards", portalService.getAllUsableSpecs().stream()
                        .map(this::calculatorSpecOption)
                        .toList(),
                "pipeTypes", pipeTypeOptions()
        );
    }

    private List<Map<String, String>> pipeTypeOptions() {
        return Arrays.stream(ObjectType.values())
                .map(type -> Map.of(
                        "value", type.name(),
                        "label", switch (type) {
                            case PIPE -> "Pipe";
                            case ELBOW -> "Elbow";
                            case REDUCER -> "Reducer";
                        }
                ))
                .toList();
    }

    public Map<String, Object> calculate(VcSimCalculateRequest payload) {
        VcSimCalculateRequest.Equipment equipment = payload.equipment();
        String sourceType = blankToDefault(payload.sourceType(), "NON_BIM");
        String fab = blankToDefault(equipment == null ? "" : equipment.fab(), "M16");
        String eqId = blankToDefault(equipment == null ? "" : equipment.eqId(), sourceType + "-MANUAL");
        String constructionNo = firstNotBlank(payload.constructionNo(), equipment == null ? "" : equipment.constructionNo());

        log.info("[SERVICE][SIM][CALCULATE] sourceType={} fab={} eqId={} constructionNo={} chamberCount={}",
                sourceType, fab, eqId, constructionNo, payload.chambers() == null ? 0 : payload.chambers().size());

        CalculateResponse saved = calculationService.calculateVcRequest(toCalculateRequest(payload, fab, eqId, constructionNo));
        List<VcSimCalculateRequest.Chamber> requestChambers = payload.chambers() == null ? List.of() : payload.chambers();
        List<VcSimResultRow> rows = saved.chambers().stream()
                .map(result -> toResultRow(result, requestChambers))
                .toList();

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("eqId", eqId);
        data.put("fab", fab);
        data.put("model", equipment == null ? "" : equipment.model());
        data.put("guid", saved.guid());
        data.put("rows", rows);

        return Map.of("success", true, "data", data);
    }

    public Map<String, Object> saveResult(VcSimSaveRequest request) {
        int rowCount = request.rows() == null ? 0 : request.rows().size();
        boolean draftAttached = request.draft() != null && (
                hasText(request.draft().get("attachmentName"))
                        || hasText(request.draft().get("attachmentId"))
                        || hasText(request.draft().get("title"))
        );
        log.info("[SERVICE][SIM][SAVE_RESULT] sourceType={} rowCount={} draftAttached={} basicInfo={}",
                request.sourceType(), rowCount, draftAttached, request.basicInfo());

        // TODO: 운영에서는 V/C Master 저장 테이블과 첨부파일 attachmentId 정책이 확정되면 이 지점에서 mapper를 분리합니다.
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("savedId", "VC-SAVE-" + UUID.randomUUID());
        data.put("sourceType", request.sourceType());
        data.put("savedAt", OffsetDateTime.now().toString());
        data.put("rowCount", rowCount);
        data.put("draftAttached", draftAttached);
        data.put("nextStatus", draftAttached ? "Draft Attached" : "Saved");
        return Map.of("success", true, "data", data);
    }

    public String buildForelineDownloadText(PortalManualDrawing drawing) {
        log.info("[SERVICE][SIM][DOWNLOAD] business=buildForelineDownloadText eqId={} constructionNo={} fileName={}",
                drawing.eqId(), drawing.constructionNo(), drawing.foreline() == null ? "" : drawing.foreline().fileName());
        return String.join(System.lineSeparator(),
                "V/C Simulation Foreline Download",
                "EQ ID: " + drawing.eqId(),
                "Construction No.: " + drawing.constructionNo(),
                "FAB: " + drawing.fab(),
                "File: " + (drawing.foreline() == null ? "" : drawing.foreline().fileName()),
                "");
    }

    private CalculateRequest toCalculateRequest(VcSimCalculateRequest payload, String fab, String eqId, String constructionNo) {
        VcSimCalculateRequest.Equipment equipment = payload.equipment();
        String model = equipment == null ? "" : equipment.model();
        List<ChamberInput> chambers = (payload.chambers() == null ? List.<VcSimCalculateRequest.Chamber>of() : payload.chambers()).stream()
                .map(chamber -> new ChamberInput(
                        firstNotBlank(chamber.chamberId(), "CH-" + blankToDefault(chamber.seq(), 1)),
                        blankToDefault(chamber.chamberName(), "CHAMBER" + blankToDefault(chamber.seq(), 1)),
                        chamber.modelStandard(),
                        decimalOrNull(chamber.minSpec()),
                        decimalOrNull(chamber.maxSpec()),
                        Boolean.TRUE.equals(chamber.isSpecSkipped()),
                        firstNotBlank(chamber.processLarge(), equipment == null ? "" : equipment.processLarge()),
                        firstNotBlank(chamber.processMiddle(), equipment == null ? "" : equipment.processMiddle()),
                        chamber.calculationTarget() == null || chamber.calculationTarget(),
                        toObjects(chamber.pipeList())
                ))
                .toList();
        return new CalculateRequest(fab, eqId, constructionNo, model, "preview", "Preview User", chambers);
    }

    private List<ObjectInput> toObjects(List<VcSimCalculateRequest.Pipe> pipeList) {
        return (pipeList == null ? List.<VcSimCalculateRequest.Pipe>of() : pipeList).stream()
                .map(pipe -> new ObjectInput(
                        objectType(pipe.type()),
                        decimal(pipe.inletDiameter()),
                        decimal(pipe.length()),
                        decimal(pipe.angle()),
                        decimal(pipe.outletDiameter()),
                        decimal(pipe.quantity())
                ))
                .toList();
    }

    private VcSimResultRow toResultRow(ChamberResultResponse result, List<VcSimCalculateRequest.Chamber> requestChambers) {
        VcSimCalculateRequest.Chamber source = requestChambers.stream()
                .filter(item -> firstNotBlank(item.chamberId(), "").equals(result.chamberId()))
                .findFirst()
                .orElseGet(() -> requestChambers.stream()
                        .filter(item -> firstNotBlank(item.chamberName(), "").equals(result.chamberName()))
                        .findFirst()
                        .orElse(null));
        boolean calculationTarget = source == null || source.calculationTarget() == null || source.calculationTarget();
        return new VcSimResultRow(
                "RESULT-" + result.chamberId(),
                result.chamberId(),
                result.chamberName(),
                "N",
                source == null ? "" : source.processLarge(),
                source == null ? "" : source.processMiddle(),
                source == null ? "" : source.modelStandard(),
                source == null ? "" : source.minSpec(),
                source == null ? "" : source.maxSpec(),
                calculationTarget ? result.measVal().stripTrailingZeros().toPlainString() : "N/A",
                calculationTarget ? normalizeJudge(result.judgeResult()) : "NA"
        );
    }

    private String normalizeJudge(JudgeResult judge) {
        if (judge == null) return "NA";
        return switch (judge) {
            case OK -> "IN";
            case NG_L -> "LOW_OUT";
            case NG_H -> "HIGH_OUT";
            case NA -> "NA";
        };
    }

    private ObjectType objectType(String value) {
        try {
            return value == null || value.isBlank() ? ObjectType.PIPE : ObjectType.valueOf(value);
        } catch (IllegalArgumentException e) {
            log.warn("[SERVICE][SIM][PIPE_TYPE][FALLBACK] unknownType={} fallback=PIPE", value);
            return ObjectType.PIPE;
        }
    }

    private BigDecimal decimal(String value) {
        if (value == null || value.isBlank()) return BigDecimal.ZERO;
        try {
            return new BigDecimal(value);
        } catch (NumberFormatException e) {
            log.warn("[SERVICE][SIM][NUMBER][FALLBACK] value={} fallback=0", value);
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal decimalOrNull(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return new BigDecimal(value);
        } catch (NumberFormatException e) {
            log.warn("[SERVICE][SIM][SPEC_NUMBER][IGNORE] value={}", value);
            return null;
        }
    }

    private Map<String, String> option(String value) {
        return Map.of("value", value, "label", value);
    }

    private Map<String, String> specOption(PortalManualDrawing.SpecOption option) {
        return Map.of(
                "value", blankToDefault(option.value(), ""),
                "label", blankToDefault(option.label(), option.value()),
                "minSpec", blankToDefault(option.minSpec(), ""),
                "maxSpec", blankToDefault(option.maxSpec(), "")
        );
    }

    private Map<String, String> calculatorSpecOption(SpecMaster spec) {
        return Map.of(
                "value", blankToDefault(spec.chambModelNm(), ""),
                "label", blankToDefault(spec.chambModelNm(), "") + " / " + blankToDefault(spec.specNm(), ""),
                "minSpec", spec.specMinVal() == null ? "" : spec.specMinVal().stripTrailingZeros().toPlainString(),
                "maxSpec", spec.specMaxVal() == null ? "" : spec.specMaxVal().stripTrailingZeros().toPlainString(),
                "fab", blankToDefault(spec.fabId(), ""),
                "model", blankToDefault(spec.setModelNm(), "")
        );
    }

    private boolean hasText(Object value) {
        return value != null && !String.valueOf(value).isBlank();
    }

    private String firstNotBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return "";
    }

    private String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String blankToDefault(Object value, Object fallback) {
        Object selected = value == null || String.valueOf(value).isBlank() ? fallback : value;
        return String.valueOf(selected);
    }
}
