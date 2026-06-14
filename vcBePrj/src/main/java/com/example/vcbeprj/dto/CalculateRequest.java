package com.example.vcbeprj.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record CalculateRequest(
        @NotBlank String fabId,
        @NotBlank String fabEqpId,
        String woId,
        String setModelNm,
        String workerEmpNo,
        String workerNm,
        @NotEmpty List<ChamberInput> chambers
) {
}
