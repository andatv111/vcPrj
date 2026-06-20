package com.example.vcbeprj.domain;

import java.util.List;

public record DesignPortalDrawing(
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
        List<SpecOption> specOptions,
        List<Chamber> chambers
) {
    public record SpecOption(String value, String label, String minSpec, String maxSpec) {
    }

    public record Chamber(
            String chamberId,
            String chamberName,
            String modelStandard,
            String minSpec,
            String maxSpec,
            String operLargeCatgVal,
            String operMidCatgVal,
            List<PipeRow> pipeRows
    ) {
    }

    public record PipeRow(
            String pipeType,
            String inletDia,
            String pipeLength,
            String angle,
            String outletDia,
            String qty
    ) {
    }
}
