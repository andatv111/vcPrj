package com.example.vcbeprj.service;

import com.example.vcbeprj.domain.DesignPortalDrawing;
import com.example.vcbeprj.dto.NonBimChamberResponse;
import com.example.vcbeprj.dto.NonBimManualDrawingResponse;
import com.example.vcbeprj.dto.NonBimPipeRowResponse;
import com.example.vcbeprj.dto.NonBimSpecOptionResponse;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DesignPortalDrawingResponseMapper {
    public NonBimManualDrawingResponse toManualDrawingResponse(DesignPortalDrawing drawing) {
        return new NonBimManualDrawingResponse(
                drawing.woId(),
                drawing.eqId(),
                drawing.siteCd(),
                drawing.siteNm(),
                drawing.fabCd(),
                drawing.fabNm(),
                drawing.area(),
                drawing.areaDetail(),
                drawing.chgType1(),
                drawing.chgType1Nm(),
                drawing.catNm(),
                drawing.crteDt(),
                drawing.crteId(),
                drawing.crteIdNm(),
                drawing.file(),
                drawing.fileSeq(),
                drawing.fileNm(),
                drawing.fileOrgNm(),
                drawing.fileDisSize(),
                drawing.requestStatus(),
                drawing.setModelNm(),
                drawing.eqpMakerNm(),
                drawing.operLargeCatgVal(),
                drawing.operMidCatgVal(),
                drawing.chamberCount(),
                toSpecOptionResponses(drawing.specOptions()),
                toChamberResponses(drawing.chambers())
        );
    }

    public List<NonBimManualDrawingResponse> toManualDrawingResponses(List<DesignPortalDrawing> drawings) {
        return (drawings == null ? List.<DesignPortalDrawing>of() : drawings).stream()
                .map(this::toManualDrawingResponse)
                .toList();
    }

    public NonBimChamberResponse toChamberResponse(DesignPortalDrawing.Chamber chamber) {
        return new NonBimChamberResponse(
                chamber.chamberId(),
                chamber.chamberName(),
                chamber.modelStandard(),
                chamber.minSpec(),
                chamber.maxSpec(),
                chamber.operLargeCatgVal(),
                chamber.operMidCatgVal(),
                toPipeRowResponses(chamber.pipeRows())
        );
    }

    public List<NonBimChamberResponse> toChamberResponses(List<DesignPortalDrawing.Chamber> chambers) {
        return (chambers == null ? List.<DesignPortalDrawing.Chamber>of() : chambers).stream()
                .map(this::toChamberResponse)
                .toList();
    }

    public NonBimSpecOptionResponse toSpecOptionResponse(DesignPortalDrawing.SpecOption option) {
        return new NonBimSpecOptionResponse(
                option.value(),
                option.label(),
                option.minSpec(),
                option.maxSpec()
        );
    }

    public List<NonBimSpecOptionResponse> toSpecOptionResponses(List<DesignPortalDrawing.SpecOption> options) {
        return (options == null ? List.<DesignPortalDrawing.SpecOption>of() : options).stream()
                .map(this::toSpecOptionResponse)
                .toList();
    }

    private NonBimPipeRowResponse toPipeRowResponse(DesignPortalDrawing.PipeRow pipeRow) {
        return new NonBimPipeRowResponse(
                pipeRow.pipeType(),
                pipeRow.inletDia(),
                pipeRow.pipeLength(),
                pipeRow.angle(),
                pipeRow.outletDia(),
                pipeRow.qty()
        );
    }

    private List<NonBimPipeRowResponse> toPipeRowResponses(List<DesignPortalDrawing.PipeRow> pipeRows) {
        return (pipeRows == null ? List.<DesignPortalDrawing.PipeRow>of() : pipeRows).stream()
                .map(this::toPipeRowResponse)
                .toList();
    }
}
