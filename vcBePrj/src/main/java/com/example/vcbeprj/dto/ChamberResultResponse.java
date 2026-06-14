package com.example.vcbeprj.dto;

import com.example.vcbeprj.domain.JudgeResult;

import java.math.BigDecimal;

public record ChamberResultResponse(
        String chamberId,
        String chamberName,
        BigDecimal measVal,
        JudgeResult judgeResult,
        String specId
) {
}
