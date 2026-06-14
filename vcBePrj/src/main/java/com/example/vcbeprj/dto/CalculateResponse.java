package com.example.vcbeprj.dto;

import java.util.List;

public record CalculateResponse(
        String guid,
        String fabId,
        String specYn,
        List<ChamberResultResponse> chambers
) {
}
