package com.example.vcbeprj.dto;

import java.util.List;

public record VcSimCalculateRequest(
        String sourceType,
        String woId,
        Search search,
        Equipment equipment,
        List<Chamber> chambers
) {
    public record Search(String fabCd, String eqId, String woId) {
    }

    public record Equipment(
            String eqId,
            String woId,
            String siteCd,
            String siteNm,
            String fabCd,
            String fabNm,
            String area,
            String areaDetail,
            String chgType1,
            String chgType1Nm,
            String catNm,
            String setModelNm,
            String modelStandard,
            String eqpMakerNm,
            String operLargeCatgVal,
            String operMidCatgVal
    ) {
    }

    public record Chamber(
            Integer seq,
            String chamberId,
            String chamberName,
            Boolean calculationTarget,
            String modelStandard,
            String minSpec,
            String maxSpec,
            Boolean isSpecSkipped,
            String processLarge,
            String processMiddle,
            List<Pipe> pipeList
    ) {
    }

    public record Pipe(
            Integer seq,
            String type,
            String inletDiameter,
            String length,
            String angle,
            String outletDiameter,
            String quantity
    ) {
    }
}
