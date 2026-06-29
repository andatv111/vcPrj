package com.example.vcbeprj.controller;

import com.example.vcbeprj.service.VcSpecMasterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vc/code")
public class VcCodeController {
    private static final Logger log = LoggerFactory.getLogger(VcCodeController.class);

    private final VcSpecMasterService specMasterService;

    public VcCodeController(VcSpecMasterService specMasterService) {
        this.specMasterService = specMasterService;
    }

    @GetMapping("/getFabOptions")
    public List<Map<String, String>> getFabOptions() {
        log.info("[API][GET /api/vc/code/getFabOptions]");
        return specMasterService.getFabOptions();
    }

    @GetMapping("/getSpecMModelOptions")
    public List<Map<String, String>> getSpecModelOptions(@RequestParam String fabId) {
        requireText(fabId, "fabId");
        log.info("[API][GET /api/vc/code/getSpecMModelOptions] fabId={}", fabId);
        return specMasterService.getSpecModelOptions(fabId);
    }

    @GetMapping("/getMSpecNMs")
    public List<Map<String, String>> getSpecNames(
            @RequestParam String fabId,
            @RequestParam String specNm
    ) {
        requireText(fabId, "fabId");
        requireText(specNm, "specNm");
        log.info("[API][GET /api/vc/code/getMSpecNMs] fabId={} specNm={}", fabId, specNm);
        return specMasterService.searchSpecNameSuggestions(fabId, specNm);
    }

    private void requireText(String value, String name) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, name + " must not be blank");
        }
    }
}
