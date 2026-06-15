package com.example.vcbeprj.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record VcRequestComponent(
        String guid,
        String chamberNmIndexVal,
        int sno,
        ObjectType typVal,
        BigDecimal innerDiamSize,
        BigDecimal length,
        BigDecimal contactPointAngle,
        BigDecimal outerDiamSize,
        BigDecimal contQty,
        BigDecimal temper,
        BigDecimal pressVal,
        LocalDateTime regTm,
        String regEmpno,
        LocalDateTime chgDtNm,
        String chgChgrEmpno
) {
}
