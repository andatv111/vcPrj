package com.example.vcbeprj.service;

import com.example.vcbeprj.domain.JudgeResult;
import com.example.vcbeprj.domain.ObjectType;
import com.example.vcbeprj.domain.SpecMaster;
import com.example.vcbeprj.domain.VcRequestChamber;
import com.example.vcbeprj.domain.VcRequestComponent;
import com.example.vcbeprj.domain.VcRequestEquipment;
import com.example.vcbeprj.dto.CalculateRequest;
import com.example.vcbeprj.dto.CalculateResponse;
import com.example.vcbeprj.dto.ChamberInput;
import com.example.vcbeprj.dto.ChamberResultResponse;
import com.example.vcbeprj.dto.ObjectInput;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class VcCalculationService {
    private static final Logger log = LoggerFactory.getLogger(VcCalculationService.class);

    private final VcRequestEquipmentService equipmentService;
    private final VcRequestComponentService componentService;
    private final VcRequestChamberService chamberService;
    private final VcSpecMasterService specMasterService;
    private final VcJudgeService judgeService;

    public VcCalculationService(
            VcRequestEquipmentService equipmentService,
            VcRequestComponentService componentService,
            VcRequestChamberService chamberService,
            VcSpecMasterService specMasterService,
            VcJudgeService judgeService
    ) {
        this.equipmentService = equipmentService;
        this.componentService = componentService;
        this.chamberService = chamberService;
        this.specMasterService = specMasterService;
        this.judgeService = judgeService;
    }

    @Transactional
    public CalculateResponse calculateVcRequest(CalculateRequest request) {
        String guid = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();
        log.info("[FLOW][CALCULATE][START] guid={} fabId={} eqId={} woId={} chamberCount={}",
                guid, request.fabId(), request.fabEqpId(), request.woId(), request.chambers().size());

        log.info("[FLOW][CALCULATE][STEP 1] create EQUIPMENT request header");
        equipmentService.createRequestHeader(toEquipment(guid, request, now));

        log.info("[FLOW][CALCULATE][STEP 2] convert chamber objects to COMPONENT rows");
        List<VcRequestComponent> componentRows = new ArrayList<>();
        for (int chamberIndex = 0; chamberIndex < request.chambers().size(); chamberIndex++) {
            ChamberInput chamber = request.chambers().get(chamberIndex);
            componentRows.addAll(toComponents(guid, chamberIndex + 1, chamber, request.workerEmpNo(), now));
        }
        log.info("[FLOW][CALCULATE][STEP 3] save COMPONENT rows count={}", componentRows.size());
        componentService.insertComponents(request.fabId(), componentRows);

        log.info("[FLOW][CALCULATE][STEP 4] calculate conductance, select SPEC, judge each chamber");
        List<VcRequestChamber> chamberRows = new ArrayList<>();
        List<ChamberResultResponse> responseRows = new ArrayList<>();
        List<JudgeResult> judgeResults = new ArrayList<>();

        for (int index = 0; index < request.chambers().size(); index++) {
            ChamberInput chamber = request.chambers().get(index);
            BigDecimal measVal = calculateConductance(chamber.objects());
            log.debug("[FLOW][CALCULATE][ENGINE] guid={} chamber={} objectCount={} measVal={}",
                    guid, chamber.chamberName(), chamber.objects() == null ? 0 : chamber.objects().size(), measVal);
            SpecMaster spec = specMasterService
                    .getSpecForJudge(request.fabId(), request.setModelNm(), chamber.chamberModelName())
                    .orElseGet(() -> requestSpecSnapshot(request, chamber));
            JudgeResult judge = chamber.calculationTarget() ? judgeService.judgeChamberSpec(measVal, spec) : JudgeResult.NA;
            log.info("[FLOW][CALCULATE][JUDGE] guid={} chamber={} chamberModel={} specId={} judge={}",
                    guid, chamber.chamberName(), chamber.chamberModelName(), spec == null ? "" : spec.specId(), judge);
            judgeResults.add(judge);
            chamberRows.add(toChamber(guid, index + 1, request, chamber, measVal, judge, spec, now));
            responseRows.add(new ChamberResultResponse(chamber.chamberId(), chamber.chamberName(), measVal, judge, spec == null ? "" : spec.specId()));
        }

        log.info("[FLOW][CALCULATE][STEP 5] save CHAMBER result rows count={}", chamberRows.size());
        chamberService.insertChamberResults(request.fabId(), chamberRows);
        String specYn = judgeService.equipmentSpecYn(judgeResults);
        log.info("[FLOW][CALCULATE][STEP 6] update EQUIPMENT SPEC_YN guid={} specYn={}", guid, specYn);
        equipmentService.updateSpecYn(request.fabId(), guid, specYn);

        log.info("[FLOW][CALCULATE][END] guid={} fabId={} specYn={} responseRows={}", guid, request.fabId(), specYn, responseRows.size());
        return new CalculateResponse(guid, request.fabId(), specYn, responseRows);
    }

    private VcRequestEquipment toEquipment(String guid, CalculateRequest request, LocalDateTime now) {
        return new VcRequestEquipment(
                guid, request.fabId(), request.fabEqpId(), request.woId(), "", "", "", "", request.setModelNm(),
                "FORELINE", "1", "Y", request.workerEmpNo(), request.workerNm(), now, "1", "", "", "",
                "NA", "N", "Y", "0", "N", "", now, request.workerEmpNo(), null, ""
        );
    }

    private List<VcRequestComponent> toComponents(String guid, int chamberSeq, ChamberInput chamber, String regEmpNo, LocalDateTime now) {
        List<VcRequestComponent> rows = new ArrayList<>();
        List<ObjectInput> objects = chamber.objects() == null ? List.of() : chamber.objects();
        for (int index = 0; index < objects.size(); index++) {
            ObjectInput object = objects.get(index);
            ObjectType type = object.objectType() == null ? ObjectType.PIPE : object.objectType();
            log.debug("[FLOW][COMPONENT][MAP] guid={} chamber={} sno={} type={} inlet={} length={} angle={} outlet={} qty={}",
                    guid, chamber.chamberName(), index + 1, type, object.inletDiameter(), object.length(),
                    object.angle(), object.outletDiameter(), object.quantity());
            rows.add(new VcRequestComponent(
                    guid,
                    String.valueOf(chamberSeq),
                    index + 1,
                    type,
                    object.inletDiameter(),
                    object.length(),
                    object.angle(),
                    object.outletDiameter(),
                    object.quantity(),
                    null,
                    null,
                    now,
                    regEmpNo,
                    null,
                    ""
            ));
        }
        return rows;
    }

    private VcRequestChamber toChamber(
            String guid,
            int chamberSeq,
            CalculateRequest request,
            ChamberInput chamber,
            BigDecimal measVal,
            JudgeResult judge,
            SpecMaster spec,
            LocalDateTime now
    ) {
        return new VcRequestChamber(
                guid, String.valueOf(chamberSeq), chamber.chamberId(), request.fabId(), request.setModelNm(),
                chamber.operLargeCatgVal(), chamber.operMidCatgVal(), chamber.chamberModelName(), measVal, judge,
                spec == null ? "" : spec.specId(), "", now, request.workerEmpNo(), null, ""
        );
    }

    private SpecMaster requestSpecSnapshot(CalculateRequest request, ChamberInput chamber) {
        // 화면 Spec은 B/E 조회 DTO에서 전달된 값입니다. Master 행이 아직 없을 때도 해당 snapshot으로 정상 판정합니다.
        if (chamber.specSkipped() || (chamber.specMinVal() == null && chamber.specMaxVal() == null)) return null;

        return new SpecMaster(
                "", "Request Spec Snapshot", request.fabId(), request.setModelNm(),
                chamber.operLargeCatgVal(), chamber.operMidCatgVal(), chamber.chamberModelName(),
                "0", "U", "N", "", "Y", chamber.specMinVal(), chamber.specMaxVal(), "", "",
                "Request snapshot fallback", "", "", "", ""
        );
    }

    private BigDecimal calculateConductance(List<ObjectInput> objects) {
        if (objects == null || objects.isEmpty()) return BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;
        for (ObjectInput object : objects) {
            BigDecimal inlet = nvl(object.inletDiameter());
            BigDecimal length = nvl(object.length());
            BigDecimal angle = nvl(object.angle());
            BigDecimal qty = nvl(object.quantity()).max(BigDecimal.ONE);
            ObjectType type = object.objectType() == null ? ObjectType.PIPE : object.objectType();
            BigDecimal score = switch (type) {
                case ELBOW -> inlet.multiply(BigDecimal.valueOf(6)).subtract(angle.multiply(BigDecimal.valueOf(0.06))).subtract(qty.multiply(BigDecimal.valueOf(2.2)));
                case REDUCER -> nvl(object.outletDiameter()).multiply(BigDecimal.valueOf(7)).subtract(length.multiply(BigDecimal.valueOf(0.01)));
                case PIPE -> inlet.multiply(BigDecimal.valueOf(9)).subtract(length.multiply(BigDecimal.valueOf(0.012)));
            };
            log.debug("[FLOW][ENGINE] type={} inlet={} length={} angle={} qty={} score={}", type, inlet, length, angle, qty, score);
            total = total.add(score);
        }
        return total.max(BigDecimal.ONE).setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private BigDecimal nvl(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
