package com.example.vcbeprj.controller;

import com.example.vcbeprj.service.VcSpecMasterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/commcode")
public class CommonCodeController {
    private static final Logger log = LoggerFactory.getLogger(CommonCodeController.class);

    private final VcSpecMasterService specMasterService;

    public CommonCodeController(VcSpecMasterService specMasterService) {
        this.specMasterService = specMasterService;
    }

    @GetMapping("/comm-code-list")
    public List<Map<String, Object>> commonCodeList(
            @RequestParam String mstCd,
            @RequestParam(required = false, defaultValue = "VC") String sysId
    ) {
        log.info("[API][GET /api/commcode/comm-code-list] mstCd={} sysId={}", mstCd, sysId);
        if (!"VC_FAB_ID".equals(mstCd)) return List.of();

        Set<String> fabIds = new LinkedHashSet<>(List.of("M14", "M15", "M16"));
        Object rawFabIds = specMasterService.filterOptions().get("fabIds");
        if (rawFabIds instanceof List<?> list) {
            list.stream().map(String::valueOf).forEach(fabIds::add);
        }

        AtomicInteger index = new AtomicInteger(1);
        return fabIds.stream()
                .map(code -> {
                    int no = index.getAndIncrement();
                    return Map.<String, Object>of(
                        "no", String.valueOf(no),
                        "mstCd", mstCd,
                        "sysId", sysId,
                        "commonCd", code,
                        "commonCdKoNm", code,
                        "commonCdEnNm", code,
                        "commonCdCnNm", code,
                        "commonCdDesc", code + "A;" + code + "B;" + code + "C",
                        "alignSeq", String.valueOf(no - 1),
                        "useYn", "Y"
                    );
                })
                .toList();
    }
}
