package com.example.vcbeprj.dto;

import java.util.List;

public record VcSimCalculateRequest(
        String sourceType,
        String constructionNo,
        Search search,
        Equipment equipment,
        List<Chamber> chambers
) {
    public record Search(String fab, String eqId, String constructionNo) {
    }

    public record Equipment(
            String eqId,
            String constructionNo,
            String site,
            String fab,
            String area1,
            String area2,
            String model,
            String modelStandard,
            String mainMaker,
            String processLarge,
            String processMiddle
    ) {
    }

    public record Chamber(
            Integer seq,
            String chamberId,
            String chamberName,
            Boolean calculationTarget,
            String modelStandard,
            String minSpec,
            String maxSpec,
            Boolean isSpecSkipped,
            String processLarge,
            String processMiddle,
            List<Pipe> pipeList
    ) {
    }

    public record Pipe(
            Integer seq,
            String type,
            String inletDiameter,
            String length,
            String angle,
            String outletDiameter,
            String quantity
    ) {
    }
}
