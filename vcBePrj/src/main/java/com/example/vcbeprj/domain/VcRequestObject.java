package com.example.vcbeprj.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record VcRequestObject(
        String guid,
        String chambNmIndexVal,
        int objectSeq,
        ObjectType objectTypeCd,
        String objectTypeNm,
        String sectionGbnCd,
        String sectionGbnNm,
        String eqpConnPointVal,
        BigDecimal inletDiameterVal,
        String inletDiameterUnitCd,
        BigDecimal lengthVal,
        String lengthUnitCd,
        BigDecimal angleVal,
        BigDecimal outletDiameterVal,
        String outletDiameterUnitCd,
        BigDecimal qtyVal,
        int sortSeq,
        String useYn,
        String regEmpno,
        LocalDateTime regTm
) {
}
