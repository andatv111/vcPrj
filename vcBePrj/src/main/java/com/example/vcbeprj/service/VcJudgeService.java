package com.example.vcbeprj.service;

import com.example.vcbeprj.domain.JudgeResult;
import com.example.vcbeprj.domain.SpecMaster;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class VcJudgeService {
    private static final Logger log = LoggerFactory.getLogger(VcJudgeService.class);

    public JudgeResult judgeChamberSpec(BigDecimal measVal, SpecMaster spec) {
        if (spec == null || !"Y".equals(spec.mgmtTgtYn())) {
            log.info("[SERVICE][JUDGE] measVal={} specId={} mgmtTgtYn={} result=NA",
                    measVal, spec == null ? "" : spec.specId(), spec == null ? "" : spec.mgmtTgtYn());
            return JudgeResult.NA;
        }
        if (measVal == null) {
            log.info("[SERVICE][JUDGE] measVal=null specId={} result=NA", spec.specId());
            return JudgeResult.NA;
        }
        if (spec.specMinVal() != null && measVal.compareTo(spec.specMinVal()) < 0) {
            log.info("[SERVICE][JUDGE] measVal={} min={} max={} specId={} result=NG_L", measVal, spec.specMinVal(), spec.specMaxVal(), spec.specId());
            return JudgeResult.NG_L;
        }
        if (spec.specMaxVal() != null && measVal.compareTo(spec.specMaxVal()) > 0) {
            log.info("[SERVICE][JUDGE] measVal={} min={} max={} specId={} result=NG_H", measVal, spec.specMinVal(), spec.specMaxVal(), spec.specId());
            return JudgeResult.NG_H;
        }
        log.info("[SERVICE][JUDGE] measVal={} min={} max={} specId={} result=OK", measVal, spec.specMinVal(), spec.specMaxVal(), spec.specId());
        return JudgeResult.OK;
    }

    public String equipmentSpecYn(List<JudgeResult> judgeResults) {
        boolean hasNg = judgeResults.stream().anyMatch(result -> result == JudgeResult.NG_L || result == JudgeResult.NG_H);
        if (hasNg) {
            log.info("[SERVICE][JUDGE][EQUIPMENT] judgeResults={} specYn=N", judgeResults);
            return "N";
        }

        boolean hasOk = judgeResults.stream().anyMatch(result -> result == JudgeResult.OK);
        if (hasOk) {
            log.info("[SERVICE][JUDGE][EQUIPMENT] judgeResults={} specYn=Y", judgeResults);
            return "Y";
        }

        log.info("[SERVICE][JUDGE][EQUIPMENT] judgeResults={} specYn=NA", judgeResults);
        return "NA";
    }
}
