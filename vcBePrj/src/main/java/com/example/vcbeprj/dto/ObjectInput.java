package com.example.vcbeprj.dto;

import com.example.vcbeprj.domain.ObjectType;

import java.math.BigDecimal;

public record ObjectInput(
        ObjectType objectType,
        BigDecimal inletDiameter,
        BigDecimal length,
        BigDecimal angle,
        BigDecimal outletDiameter,
        BigDecimal quantity
) {
}
