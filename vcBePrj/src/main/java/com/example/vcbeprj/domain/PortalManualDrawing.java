package com.example.vcbeprj.domain;

import java.util.List;

public record PortalManualDrawing(
        String drawingKey,
        String constructionNo,
        String eqId,
        String site,
        String fab,
        String area1,
        String area2,
        String changeType,
        String equipmentType,
        String requestStatus,
        String model,
        String mainMaker,
        String processLarge,
        String processMiddle,
        int chamberCount,
        List<SpecOption> specOptions,
        List<Chamber> chambers,
        Foreline foreline
) {
    public record SpecOption(String value, String label, String minSpec, String maxSpec) {
    }

    public record Chamber(
            String chamberId,
            String chamberName,
            String modelStandard,
            String minSpec,
            String maxSpec,
            String processLarge,
            String processMiddle,
            List<PipeRow> pipeRows
    ) {
    }

    public record PipeRow(
            String pipeType,
            String inletDia,
            String pipeLength,
            String angle,
            String outletDia,
            String qty
    ) {
    }

    public record Foreline(
            String categoryName,
            String registeredAt,
            String registeredBy,
            String fileId,
            String fileName
    ) {
    }
}
