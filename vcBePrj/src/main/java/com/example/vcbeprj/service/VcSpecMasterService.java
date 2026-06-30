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
        List<SpecMaster> result = activeRows().stream()
                .filter(row -> row.fabId().equals(fabId))
                .filter(row -> setModelNm == null || setModelNm.isBlank() || row.setModelNm().equals(setModelNm))
                .filter(row -> "0".equals(row.modelSpecUseYn()))
                .toList();
        log.info("[SERVICE][SPEC_MASTER][SELECT][DONE] resultCount={}", result.size());
        return result;
    }

    public Optional<SpecMaster> getSpecForJudge(String fabId, String setModelNm, String chamberModelNm) {
        log.info("[SERVICE][SPEC_MASTER][SELECT] business=getSpecForJudge table={} fabId={} setModelNm={} chamberModelNm={}", SPEC_TABLE, fabId, setModelNm, chamberModelNm);
        Optional<SpecMaster> result = activeRows().stream()
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
        return activeRows().stream()
                .filter(this::validateSpecUsable)
                .toList();
    }

    public List<SpecMaster> searchMasters(String fabId, String setModelNm, String specNm) {
        log.info("[SERVICE][SPEC_MASTER][SELECT] business=searchMasters table={} fabId={} setModelNm={} specNm={}",
                SPEC_TABLE, fabId, setModelNm, specNm);
        return activeRows().stream()
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

    public List<Map<String, String>> getFabOptions() {
        log.info("[SERVICE][SPEC_MASTER][SELECT] business=getFabOptions table={}", SPEC_TABLE);
        return toOptions(distinctOptions(activeRows(), SpecMaster::fabId));
    }

    public List<Map<String, String>> getSpecModelOptions(String fabId) {
        log.info("[SERVICE][SPEC_MASTER][SELECT] business=getSpecModelOptions table={} fabId={}", SPEC_TABLE, fabId);
        if (isBlank(fabId)) return List.of();

        List<String> models = activeRows().stream()
                .filter(row -> equalsText(row.fabId(), fabId))
                .map(SpecMaster::setModelNm)
                .filter(value -> !isBlank(value))
                .distinct()
                .sorted()
                .toList();
        return toOptions(models);
    }

    public List<Map<String, String>> searchSpecNameSuggestions(String fabId, String specNm) {
        log.info("[SERVICE][SPEC_MASTER][SELECT] business=searchSpecNameSuggestions table={} fabId={} specNm={}",
                SPEC_TABLE, fabId, specNm);
        if (isBlank(fabId) || isBlank(specNm)) return List.of();

        return activeRows().stream()
                .filter(row -> equalsText(row.fabId(), fabId))
                .filter(row -> containsText(row.specNm(), specNm))
                .map(row -> Map.of(
                        "value", row.specNm(),
                        "label", displayText(row.setModelNm())
                ))
                .collect(Collectors.toMap(
                        item -> item.get("value"),
                        Function.identity(),
                        (left, ignored) -> left,
                        LinkedHashMap::new
                ))
                .values()
                .stream()
                .limit(10)
                .toList();
    }

    public List<Map<String, String>> searchSpecNameSuggestions(String keyword) {
        log.info("[SERVICE][SPEC_MASTER][SELECT] business=searchSpecNameSuggestions table={} keyword={}", SPEC_TABLE, keyword);

        return activeRows().stream()
                .filter(row -> isBlank(keyword) || containsText(row.specNm(), keyword))
                .map(row -> Map.of(
                        "value", row.specNm(),
                        "label", displayText(row.fabId()) + " / " + displayText(row.setModelNm())
                ))
                .collect(Collectors.toMap(
                        item -> item.get("value"),
                        Function.identity(),
                        (left, ignored) -> left,
                        LinkedHashMap::new
                ))
                .values()
                .stream()
                .limit(10)
                .toList();
    }

    public List<SpecMaster> searchAll(String fabId, String setModelNm, String operLargeCatgVal, String operMidCatgVal, String chambModelNm) {
        log.info("[SERVICE][SPEC_MASTER][SELECT] business=searchAll table={} fabId={} setModelNm={} operLarge={} operMid={} chamber={}",
                SPEC_TABLE, fabId, setModelNm, operLargeCatgVal, operMidCatgVal, chambModelNm);
        return activeRows().stream()
                .filter(row -> isBlank(fabId) || equalsText(row.fabId(), fabId))
                .filter(row -> isBlank(setModelNm) || equalsText(row.setModelNm(), setModelNm))
                .filter(row -> isBlank(operLargeCatgVal) || equalsText(row.operLargeCatgVal(), operLargeCatgVal))
                .filter(row -> isBlank(operMidCatgVal) || equalsText(row.operMidCatgVal(), operMidCatgVal))
                .filter(row -> isBlank(chambModelNm) || equalsText(row.chambModelNm(), chambModelNm))
                .toList();
    }

    public Optional<SpecMaster> getById(String specId) {
        return activeRows().stream()
                .filter(row -> equalsText(row.specId(), specId))
                .findFirst();
    }

    public List<SpecMaster> getChildren(String parentSpecId) {
        log.info("[SERVICE][SPEC_MASTER][SELECT] business=getChildren table={} parentSpecId={}", SPEC_TABLE, parentSpecId);
        return activeRows().stream()
                // Detail row는 upperCd에 상위 Master의 specId를 저장합니다.
                .filter(row -> equalsText(row.upperCd(), parentSpecId))
                .sorted(Comparator
                        .comparing(SpecMaster::operLargeCatgVal, Comparator.nullsLast(String::compareTo))
                        .thenComparing(SpecMaster::operMidCatgVal, Comparator.nullsLast(String::compareTo))
                        .thenComparing(SpecMaster::chambModelNm, Comparator.nullsLast(String::compareTo)))
                .toList();
    }

    public List<SpecMaster> getChildrenForMasters(List<SpecMaster> masters) {
        List<String> masterSpecIds = masters.stream().map(SpecMaster::specId).toList();
        if (masterSpecIds.isEmpty()) return List.of();

        return activeRows().stream()
                .filter(row -> masterSpecIds.contains(row.upperCd()))
                .sorted(Comparator
                        .comparing(SpecMaster::upperCd, Comparator.nullsLast(String::compareTo))
                        .thenComparing(SpecMaster::operLargeCatgVal, Comparator.nullsLast(String::compareTo))
                        .thenComparing(SpecMaster::operMidCatgVal, Comparator.nullsLast(String::compareTo))
                        .thenComparing(SpecMaster::chambModelNm, Comparator.nullsLast(String::compareTo)))
                .toList();
    }

    public Map<String, Object> filterOptions() {
        List<SpecMaster> rows = activeRows();
        Map<String, Object> result = new LinkedHashMap<>();
        // 콤보 API는 조회 결과와 분리한다. 화면 테스트가 가능한 소수 후보만 내려 과도한 콤보 노출을 막는다.
        result.put("fabIds", List.of("M16", "M15", "M14", "M13", "M12"));
        result.put("areas", List.of("M16A", "M16B", "M15A", "M15B", "M14A", "M14B", "M13A", "M12A"));
        result.put("makers", List.of("TEL", "AMAT", "LAM", "SEMES"));
        result.put("setModelNms", limitedOptions(rows, SpecMaster::setModelNm, 8));
        result.put("specNms", limitedOptions(rows, SpecMaster::specNm, 8));
        result.put("operLargeCatgVals", List.of("ETCH", "CVD", "LITHO", "UTILITY"));
        result.put("operMidCatgVals", List.of("Metal Etch", "Clean", "Deposition", "Coater", "Vacuum Pump"));
        result.put("chambModelNms", List.of("ETCH-STD-A", "CVD-M12-A", "LITHO-STD-A", "PUMP-STD-A"));
        result.put("areasByFab", Map.of(
                "M16", List.of("M16A", "M16B"),
                "M15", List.of("M15A", "M15B"),
                "M14", List.of("M14A", "M14B"),
                "M13", List.of("M13A"),
                "M12", List.of("M12A")
        ));
        result.put("makersByArea", Map.of(
                "M16A", List.of("TEL", "AMAT"),
                "M16B", List.of("LAM"),
                "M15A", List.of("AMAT", "SEMES"),
                "M15B", List.of("TEL"),
                "M14A", List.of("LAM", "SEMES"),
                "M14B", List.of("TEL"),
                "M13A", List.of("LAM"),
                "M12A", List.of("AMAT")
        ));
        result.put("modelsByFab", Map.of(
                "M16", List.of("VX-ETCH-300", "CV-Pro-12", "Pump Rack 8"),
                "M15", List.of("PVD-Metal-5", "CMP-Fine-8"),
                "M14", modelsForFab(rows, "M14"),
                "M13", modelsForFab(rows, "M13"),
                "M12", modelsForFab(rows, "M12")
        ));
        result.put("modelsByMaker", Map.of(
                "TEL", List.of("VX-ETCH-300", "LabVC-Mini", "LITHO-Track-4"),
                "AMAT", List.of("CV-Pro-12", "PVD-Metal-5", "ASH-Pro-70", "DIFF-900", "CVD-Legacy-2"),
                "LAM", List.of("VX-ETCH-200", "Pump Rack 8", "IMP-X4", "WET-Clean-20", "DRY-Etch-10", "WetBench-6", "PVD-M13-3"),
                "SEMES", List.of("CMP-Fine-8", "MET-CD-3")
        ));
        result.put("operMidByLarge", Map.of(
                "ETCH", List.of("Metal Etch", "Clean"),
                "CVD", List.of("Deposition"),
                "LITHO", List.of("Coater", "Developer"),
                "UTILITY", List.of("Vacuum Pump")
        ));
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

    public boolean validateSpecUsable(SpecMaster spec) {
        return isActive(spec) && "0".equals(spec.modelSpecUseYn());
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
                value(payload, "delYn", "N"),
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
                value(payload, "delYn", current.delYn()),
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

    private List<SpecMaster> activeRows() {
        return repository.selectAll(SPEC_TABLE, SpecMaster.class).stream()
                .filter(this::isActive)
                .toList();
    }

    private boolean isActive(SpecMaster row) {
        return row != null && !"Y".equalsIgnoreCase(row.delYn());
    }

    private List<Map<String, String>> toOptions(List<String> values) {
        return values.stream()
                .map(value -> Map.of("value", value, "label", value))
                .toList();
    }

    private List<String> limitedOptions(List<SpecMaster> rows, Function<SpecMaster, String> mapper, int limit) {
        return rows.stream()
                .map(mapper)
                .filter(value -> !isBlank(value))
                .distinct()
                .sorted()
                .limit(limit)
                .collect(Collectors.toList());
    }

    private List<String> modelsForFab(List<SpecMaster> rows, String fabId) {
        return rows.stream()
                .filter(row -> equalsText(row.fabId(), fabId))
                .map(SpecMaster::setModelNm)
                .filter(value -> !isBlank(value))
                .distinct()
                .sorted()
                .limit(4)
                .collect(Collectors.toList());
    }

    private String value(Map<String, Object> payload, String key, String fallback) {
        Object value = payload.get(key);
        if (value == null) return fallback == null ? "" : fallback;
        return String.valueOf(value);
    }

    private String displayText(String value) {
        return value == null ? "" : value;
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
