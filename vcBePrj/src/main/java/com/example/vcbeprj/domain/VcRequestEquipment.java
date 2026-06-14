package com.example.vcbeprj.domain;

import java.time.LocalDateTime;

public record VcRequestEquipment(
        String guid,
        String fabId,
        String fabEqpId,
        String woId,
        String buildingId,
        String areaId,
        String dareaId,
        String eqpMakerNm,
        String eqpModelNm,
        String dwgGbnNm,
        String verVal,
        String handEntryYn,
        String workEmpno,
        String workNm,
        LocalDateTime workTm,
        String prgsStatCd,
        String downloadUrl,
        String fileNm,
        String folderPathVal,
        String specYn,
        String convYn,
        String inqYn,
        String workStatCd,
        String procYn,
        String docUrl,
        String regEmpno,
        LocalDateTime regTm,
        String chgEmpno,
        LocalDateTime chgTm
) {
}
