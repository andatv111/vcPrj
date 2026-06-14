package com.example.vcbeprj.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.util.List;

public record ChamberInput(
        @NotBlank String chamberId,
        @NotBlank String chamberName,
        String chamberModelName,
        BigDecimal specMinVal,
        BigDecimal specMaxVal,
        boolean specSkipped,
        String operLargeCatgVal,
        String operMidCatgVal,
        boolean calculationTarget,
        List<ObjectInput> objects
) {
}
