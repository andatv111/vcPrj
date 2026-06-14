package com.example.vcbeprj.service;

import com.example.vcbeprj.domain.SpecMaster;
import com.example.vcbeprj.repository.TxtTableRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class VcSpecMasterService {
    private static final Logger log = LoggerFactory.getLogger(VcSpecMasterService.class);
    private static final String SPEC_TABLE = "VCW_VC_SPEC_MST";
    private final TxtTableRepository repository;

    public VcSpecMasterService(TxtTableRepository repository) {
        this.repository = repository;
    }

    public List<SpecMaster> getSpecByEquipmentCondition(String fabId, String setModelNm) {
        log.info("[SERVICE][SPEC_MASTER][SELECT] business=getSpecByEquipmentCondition table={} fabId={} setModelNm={}", SPEC_TABLE, fabId, setModelNm);
        List<SpecMaster> result = repository.selectAll(SPEC_TABLE, SpecMaster.class).stream()
                .filter(row -> row.fabId().equals(fabId))
                .filter(row -> setModelNm == null || setModelNm.isBlank() || row.setModelNm().equals(setModelNm))
                .filter(row -> "0".equals(row.modelSpecUseYn()))
                .toList();
        log.info("[SERVICE][SPEC_MASTER][SELECT][DONE] resultCount={}", result.size());
        return result;
    }

    public Optional<SpecMaster> getSpecForJudge(String fabId, String setModelNm, String chamberModelNm) {
        log.info("[SERVICE][SPEC_MASTER][SELECT] business=getSpecForJudge table={} fabId={} setModelNm={} chamberModelNm={}", SPEC_TABLE, fabId, setModelNm, chamberModelNm);
        Optional<SpecMaster> result = repository.selectAll(SPEC_TABLE, SpecMaster.class).stream()
                .filter(row -> row.fabId().equals(fabId))
                .filter(row -> row.setModelNm().equals(setModelNm))
                .filter(row -> row.chambModelNm().equals(chamberModelNm))
                .filter(this::validateSpecUsable)
                .findFirst();
        log.info("[SERVICE][SPEC_MASTER][SELECT][DONE] found={} specId={}", result.isPresent(), result.map(SpecMaster::specId).orElse(""));
        return result;
    }

    public List<SpecMaster> getAllUsableSpecs() {
        log.info("[SERVICE][SPEC_MASTER][SELECT] business=getAllUsableSpecs table={}", SPEC_TABLE);
        return repository.selectAll(SPEC_TABLE, SpecMaster.class).stream()
                .filter(this::validateSpecUsable)
                .toList();
    }

    public boolean validateSpecUsable(SpecMaster spec) {
        return spec != null && "0".equals(spec.modelSpecUseYn());
    }

    public String getSpecManager(String specId) {
        log.info("[SERVICE][SPEC_MASTER][SELECT] business=getSpecManager table={} specId={}", SPEC_TABLE, specId);
        return repository.selectAll(SPEC_TABLE, SpecMaster.class).stream()
                .filter(row -> row.specId().equals(specId))
                .map(SpecMaster::chgrNm)
                .findFirst()
                .orElse("");
    }
}
