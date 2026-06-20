package com.example.vcbeprj.dto;

public record NonBimPipeRowResponse(
        String pipeType,
        String inletDia,
        String pipeLength,
        String angle,
        String outletDia,
        String qty
) {
}
