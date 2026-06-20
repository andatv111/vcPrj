package com.example.vcbeprj.dto;

import java.util.List;

public record NonBimChamberResponse(
        String chamberId,
        String chamberName,
        String modelStandard,
        String minSpec,
        String maxSpec,
        String operLargeCatgVal,
        String operMidCatgVal,
        List<NonBimPipeRowResponse> pipeRows
) {
}
