package com.example.vcbeprj.dto;

import java.util.List;

public record NonBimManualDrawingResponse(
        String woId,
        String eqId,
        String siteCd,
        String siteNm,
        String fabCd,
        String fabNm,
        String area,
        String areaDetail,
        String chgType1,
        String chgType1Nm,
        String catNm,
        String crteDt,
        String crteId,
        String crteIdNm,
        String file,
        String fileSeq,
        String fileNm,
        String fileOrgNm,
        String fileDisSize,
        String requestStatus,
        String setModelNm,
        String eqpMakerNm,
        String operLargeCatgVal,
        String operMidCatgVal,
        int chamberCount,
        List<NonBimSpecOptionResponse> specOptions,
        List<NonBimChamberResponse> chambers
) {
}
