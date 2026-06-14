package com.example.vcbeprj.domain;

import java.math.BigDecimal;

public record SpecMaster(
        String specId,
        String specNm,
        String fabId,
        String setModelNm,
        String operLargeCatgVal,
        String operMidCatgVal,
        String chambModelNm,
        String modelSpecUseYn,
        String mgmtTgtYn,
        BigDecimal specMinVal,
        BigDecimal specMaxVal,
        String chgrEmpno,
        String chgrNm
) {
}
