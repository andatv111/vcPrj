package com.example.vcbeprj.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record VcRequestChamber(
        String guid,
        String chambNmIndexVal,
        String chamberId,
        String fabId,
        String setModelNm,
        String operLargeCatgVal,
        String operMidCatgVal,
        String chambModelNm,
        BigDecimal measVal,
        JudgeResult judgeRsltVal,
        String specId,
        String eqpConnPointVal,
        BigDecimal specMinValSnap,
        BigDecimal specMaxValSnap,
        String mgmtTgtYnSnap,
        String regEmpno,
        LocalDateTime regTm
) {
}
