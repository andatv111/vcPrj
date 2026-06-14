package com.example.vcbeprj.dto;

public record VcSimResultRow(
        String id,
        String chamberId,
        String chamberName,
        String confirmFlag,
        String processLarge,
        String processMiddle,
        String modelStandard,
        String minSpec,
        String maxSpec,
        String conductance,
        String judge
) {
}
