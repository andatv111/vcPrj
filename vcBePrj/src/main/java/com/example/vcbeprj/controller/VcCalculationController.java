package com.example.vcbeprj.controller;

import com.example.vcbeprj.domain.SpecMaster;
import com.example.vcbeprj.domain.VcRequestEquipment;
import com.example.vcbeprj.dto.CalculateRequest;
import com.example.vcbeprj.dto.CalculateResponse;
import com.example.vcbeprj.service.VcCalculationService;
import com.example.vcbeprj.service.VcRequestEquipmentService;
import com.example.vcbeprj.service.VcSpecMasterService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/vc")
public class VcCalculationController {
    private static final Logger log = LoggerFactory.getLogger(VcCalculationController.class);

    private final VcCalculationService calculationService;
    private final VcSpecMasterService specMasterService;
    private final VcRequestEquipmentService equipmentService;

    public VcCalculationController(
            VcCalculationService calculationService,
            VcSpecMasterService specMasterService,
            VcRequestEquipmentService equipmentService
    ) {
        this.calculationService = calculationService;
        this.specMasterService = specMasterService;
        this.equipmentService = equipmentService;
    }

    @GetMapping("/specs")
    public List<SpecMaster> specs(@RequestParam String fabId, @RequestParam(required = false) String setModelNm) {
        log.info("[API][GET /api/vc/specs] fabId={} setModelNm={}", fabId, setModelNm);
        return specMasterService.getSpecByEquipmentCondition(fabId, setModelNm);
    }

    @PostMapping("/calculate")
    public CalculateResponse calculate(@Valid @RequestBody CalculateRequest request) {
        log.info("[API][POST /api/vc/calculate] fabId={} eqId={} chamberCount={}",
                request.fabId(), request.fabEqpId(), request.chambers().size());
        return calculationService.calculateVcRequest(request);
    }

    @GetMapping("/{fabId}/requests")
    public List<VcRequestEquipment> requests(@PathVariable String fabId) {
        log.info("[API][GET /api/vc/{fabId}/requests] fabId={}", fabId);
        return equipmentService.getRequestHeaders(fabId);
    }
}
