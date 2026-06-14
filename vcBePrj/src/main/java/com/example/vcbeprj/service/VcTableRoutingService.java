package com.example.vcbeprj.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class VcTableRoutingService {
    private static final Logger log = LoggerFactory.getLogger(VcTableRoutingService.class);

    public VcTableSet tableSet(String fabId) {
        VcTableSet tableSet = switch (fabId) {
            case "M16" -> new VcTableSet("M16_VC_REQ_EQUIPMENT", "M16_VC_REQ_CHAMBER", "M16_VC_REQ_OBJECT");
            case "M15" -> new VcTableSet("M15_VC_REQ_EQUIPMENT", "M15_VC_REQ_CHAMBER", "M15_VC_REQ_OBJECT");
            case "M14" -> new VcTableSet("M14_VC_REQ_EQUIPMENT", "M14_VC_REQ_CHAMBER", "M14_VC_REQ_OBJECT");
            default -> throw new IllegalArgumentException("Unsupported FAB_ID: " + fabId);
        };
        log.debug("[TABLE_ROUTING] fabId={} equipmentTable={} chamberTable={} objectTable={}",
                fabId, tableSet.equipmentTable(), tableSet.chamberTable(), tableSet.objectTable());
        return tableSet;
    }
}
