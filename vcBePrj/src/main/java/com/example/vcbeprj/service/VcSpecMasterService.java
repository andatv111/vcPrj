package com.example.vcbeprj.service;

import com.example.vcbeprj.domain.SpecMaster;
import com.example.vcbeprj.repository.TxtTableRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

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

    public List<SpecMaster> searchMasters(String fabId, String setModelNm, String specNm) {
        log.info("[SERVICE][SPEC_MASTER][SELECT] business=searchMasters table={} fabId={} setModelNm={} specNm={}",
                SPEC_TABLE, fabId, setModelNm, specNm);
        return repository.selectAll(SPEC_TABLE, SpecMaster.class).stream()
                // SpecMaster 화면의 좌측 grid는 Master만 보여야 하므로 upperCd가 비어 있는 row만 사용합니다.
                .filter(row -> isBlank(row.upperCd()))
                .filter(row -> isBlank(fabId) || equalsText(row.fabId(), fabId))
                .filter(row -> isBlank(setModelNm) || equalsText(row.setModelNm(), setModelNm))
                .filter(row -> isBlank(specNm) || containsText(row.specNm(), specNm))
                .sorted(Comparator
                        .comparing(SpecMaster::fabId, Comparator.nullsLast(String::compareTo))
                        .thenComparing(SpecMaster::setModelNm, Comparator.nullsLast(String::compareTo))
                        .thenComparing(SpecMaster::specNm, Comparator.nullsLast(String::compareTo)))
                .toList();
    }

    public List<SpecMaster> searchAll(String fabId, String setModelNm, String operLargeCatgVal, String operMidCatgVal, String chambModelNm) {
        log.info("[SERVICE][SPEC_MASTER][SELECT] business=searchAll table={} fabId={} setModelNm={} operLarge={} operMid={} chamber={}",
                SPEC_TABLE, fabId, setModelNm, operLargeCatgVal, operMidCatgVal, chambModelNm);
        return repository.selectAll(SPEC_TABLE, SpecMaster.class).stream()
                .filter(row -> isBlank(fabId) || equalsText(row.fabId(), fabId))
                .filter(row -> isBlank(setModelNm) || equalsText(row.setModelNm(), setModelNm))
                .filter(row -> isBlank(operLargeCatgVal) || equalsText(row.operLargeCatgVal(), operLargeCatgVal))
                .filter(row -> isBlank(operMidCatgVal) || equalsText(row.operMidCatgVal(), operMidCatgVal))
                .filter(row -> isBlank(chambModelNm) || equalsText(row.chambModelNm(), chambModelNm))
                .toList();
    }

    public Optional<SpecMaster> getById(String specId) {
        return repository.selectAll(SPEC_TABLE, SpecMaster.class).stream()
                .filter(row -> equalsText(row.specId(), specId))
                .findFirst();
    }

    public List<SpecMaster> getChildren(String parentSpecId) {
        log.info("[SERVICE][SPEC_MASTER][SELECT] business=getChildren table={} parentSpecId={}", SPEC_TABLE, parentSpecId);
        return repository.selectAll(SPEC_TABLE, SpecMaster.class).stream()
                // Detail row는 upperCd에 상위 Master의 specId를 저장합니다.
                .filter(row -> equalsText(row.upperCd(), parentSpecId))
                .sorted(Comparator
                        .comparing(SpecMaster::operLargeCatgVal, Comparator.nullsLast(String::compareTo))
                        .thenComparing(SpecMaster::operMidCatgVal, Comparator.nullsLast(String::compareTo))
                        .thenComparing(SpecMaster::chambModelNm, Comparator.nullsLast(String::compareTo)))
                .toList();
    }

    public Map<String, Object> filterOptions() {
        List<SpecMaster> rows = repository.selectAll(SPEC_TABLE, SpecMaster.class);
        Map<String, Object> result = new LinkedHashMap<>();
        // FAB는 F/E에서 공통코드 API를 원천으로 보지만, filterOptions에도 보조 후보를 내려 호환성을 유지합니다.
        result.put("fabIds", distinctOptions(rows, SpecMaster::fabId));
        result.put("areas", List.of());
        result.put("makers", List.of());
        result.put("setModelNms", distinctOptions(rows, SpecMaster::setModelNm));
        result.put("specNms", distinctOptions(rows, SpecMaster::specNm));
        result.put("operLargeCatgVals", distinctOptions(rows, SpecMaster::operLargeCatgVal));
        result.put("operMidCatgVals", distinctOptions(rows, SpecMaster::operMidCatgVal));
        result.put("chambModelNms", distinctOptions(rows, SpecMaster::chambModelNm));
        result.put("rows", rows);
        return result;
    }

    public SpecMaster createMaster(Map<String, Object> payload) {
        // Master row는 upperCd를 비워 저장합니다.
        SpecMaster row = toSpecMaster(payload, "", "");
        repository.insert(SPEC_TABLE, row);
        return row;
    }

    public SpecMaster createChild(String parentSpecId, Map<String, Object> payload) {
        // Detail row는 upperCd에 parentSpecId를 저장해 Master와 연결합니다.
        SpecMaster row = toSpecMaster(payload, parentSpecId, "");
        repository.insert(SPEC_TABLE, row);
        return row;
    }

    public SpecMaster update(String specId, Map<String, Object> payload) {
        SpecMaster current = getById(specId)
                .orElseThrow(() -> new IllegalArgumentException("Spec Master row not found: " + specId));
        SpecMaster updated = merge(current, payload);
        int count = repository.updateWhere(SPEC_TABLE, SpecMaster.class, row -> equalsText(row.specId(), specId), row -> updated);
        if (count == 0) throw new IllegalArgumentException("Spec Master row not found: " + specId);
        return updated;
    }

    public int delete(String specId) {
        // 현재 preview 정책은 Master 삭제 시 하위 Detail도 함께 삭제입니다.
        // 운영 정책이 "하위 Detail이 있으면 삭제 불가"로 바뀌면 이 경계만 조정하면 됩니다.
        int deletedChildren = repository.deleteWhere(SPEC_TABLE, SpecMaster.class, row -> equalsText(row.upperCd(), specId));
        int deletedSelf = repository.deleteWhere(SPEC_TABLE, SpecMaster.class, row -> equalsText(row.specId(), specId));
        return deletedChildren + deletedSelf;
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

    private SpecMaster toSpecMaster(Map<String, Object> payload, String upperCd, String specId) {
        String now = OffsetDateTime.now().toString();
        return new SpecMaster(
                value(payload, "specId", isBlank(specId) ? "SPEC-" + UUID.randomUUID() : specId),
                value(payload, "specNm", ""),
                value(payload, "fabId", ""),
                value(payload, "setModelNm", ""),
                value(payload, "operLargeCatgVal", ""),
                value(payload, "operMidCatgVal", ""),
                value(payload, "chambModelNm", ""),
                value(payload, "modelSpecUseYn", "0"),
                value(payload, "srcGbnCd", "U"),
                value(payload, "detSearYn", "N"),
                value(payload, "upperCd", upperCd),
                value(payload, "mgmtTgtYn", "Y"),
                decimal(payload.get("specMinVal")),
                decimal(payload.get("specMaxVal")),
                value(payload, "chgrEmpno", ""),
                value(payload, "chgrNm", ""),
                value(payload, "specDesc", ""),
                now,
                value(payload, "regEmpno", ""),
                now,
                value(payload, "chgChgrEmpno", "")
        );
    }

    private SpecMaster merge(SpecMaster current, Map<String, Object> payload) {
        return new SpecMaster(
                current.specId(),
                value(payload, "specNm", current.specNm()),
                value(payload, "fabId", current.fabId()),
                value(payload, "setModelNm", current.setModelNm()),
                value(payload, "operLargeCatgVal", current.operLargeCatgVal()),
                value(payload, "operMidCatgVal", current.operMidCatgVal()),
                value(payload, "chambModelNm", current.chambModelNm()),
                value(payload, "modelSpecUseYn", current.modelSpecUseYn()),
                value(payload, "srcGbnCd", current.srcGbnCd()),
                value(payload, "detSearYn", current.detSearYn()),
                value(payload, "upperCd", current.upperCd()),
                value(payload, "mgmtTgtYn", current.mgmtTgtYn()),
                payload.containsKey("specMinVal") ? decimal(payload.get("specMinVal")) : current.specMinVal(),
                payload.containsKey("specMaxVal") ? decimal(payload.get("specMaxVal")) : current.specMaxVal(),
                value(payload, "chgrEmpno", current.chgrEmpno()),
                value(payload, "chgrNm", current.chgrNm()),
                value(payload, "specDesc", current.specDesc()),
                current.regTm(),
                current.regEmpno(),
                OffsetDateTime.now().toString(),
                value(payload, "chgChgrEmpno", current.chgChgrEmpno())
        );
    }

    private List<String> distinctOptions(List<SpecMaster> rows, Function<SpecMaster, String> mapper) {
        return rows.stream()
                .map(mapper)
                .filter(value -> !isBlank(value))
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    private String value(Map<String, Object> payload, String key, String fallback) {
        Object value = payload.get(key);
        if (value == null) return fallback == null ? "" : fallback;
        return String.valueOf(value);
    }

    private BigDecimal decimal(Object value) {
        if (value == null || String.valueOf(value).isBlank()) return null;
        return new BigDecimal(String.valueOf(value));
    }

    private boolean equalsText(String left, String right) {
        return !isBlank(left) && !isBlank(right) && left.equalsIgnoreCase(right);
    }

    private boolean containsText(String left, String right) {
        return !isBlank(left) && !isBlank(right) && left.toLowerCase().contains(right.toLowerCase());
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
