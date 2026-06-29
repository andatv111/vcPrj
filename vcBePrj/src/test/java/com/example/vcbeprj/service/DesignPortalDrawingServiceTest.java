package com.example.vcbeprj.service;

import com.example.vcbeprj.domain.DesignPortalDrawing;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DesignPortalDrawingServiceTest {

    private static final Path TEST_DATA_PATH = createTestDataDirectory();

    @DynamicPropertySource
    static void mockDbProperties(DynamicPropertyRegistry registry) {
        registry.add("vc.mock-db.base-path", () -> TEST_DATA_PATH.toString());
    }

    @Autowired
    private DesignPortalDrawingService portalService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MockMvc mockMvc;

    @Test
    void manualDrawingResponseUsesBusinessKeyWithoutGenericId() {
        DesignPortalDrawing drawing = portalService.findByBusinessKey(
                "EQ-VAC-ETCH-1001",
                "VC-2026-ETCH-001"
        );

        JsonNode response = objectMapper.valueToTree(drawing);

        assertThat(response.has("id")).isFalse();
        assertThat(response.path("eqId").asText()).isEqualTo("EQ-VAC-ETCH-1001");
        assertThat(response.path("woId").asText()).isEqualTo("VC-2026-ETCH-001");
        assertThat(response.path("fabCd").asText()).isEqualTo("M16");
        assertThat(response.path("file").asText()).isEqualTo("FILE-ETCH-001");
    }

    @Test
    void chamberLookupUsesEquipmentAndWoId() {
        List<DesignPortalDrawing.Chamber> chambers = portalService.getDrawingChambers(
                "EQ-VAC-ETCH-1001",
                "VC-2026-ETCH-001"
        );

        assertThat(chambers)
                .extracting(DesignPortalDrawing.Chamber::chamberName)
                .containsExactly("Ch01 Main Process", "Ch02 Side Pump", "Ch03 Exhaust");
    }

    @Test
    void manualDrawingApiDoesNotExposeDatabaseDrawingId() throws Exception {
        mockMvc.perform(get("/api/vc/sim/non-bim/manual-drawings")
                        .queryParam("fabCd", "M16")
                        .queryParam("eqId", "EQ-VAC-ETCH-1001")
                        .queryParam("woId", "VC-2026-ETCH-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").doesNotExist())
                .andExpect(jsonPath("$[0].eqId").value("EQ-VAC-ETCH-1001"))
                .andExpect(jsonPath("$[0].woId").value("VC-2026-ETCH-001"))
                .andExpect(jsonPath("$[0].fabCd").value("M16"))
                .andExpect(jsonPath("$[0].file").value("FILE-ETCH-001"));
    }

    @Test
    void etchPreviewEquipmentHasEnoughRowsForThreeFourRowPages() throws Exception {
        mockMvc.perform(get("/api/vc/sim/non-bim/manual-drawings")
                        .queryParam("fabCd", "M16")
                        .queryParam("eqId", "EQ-VAC-ETCH-1001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(11))
                .andExpect(jsonPath("$[?(@.woId == 'VC-2026-ETCH-011')]").isNotEmpty());
    }

    @Test
    void nonBimOptionsExposeFabValuesForSearchCondition() throws Exception {
        mockMvc.perform(get("/api/vc/sim/non-bim/options"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fabs[?(@.value == 'M14')].label").value("M14"))
                .andExpect(jsonPath("$.fabs[?(@.value == 'M15')].label").value("M15"))
                .andExpect(jsonPath("$.fabs[?(@.value == 'M16')].label").value("M16"));
    }

    @Test
    void calculationUsesRequestedSpecSnapshotWhenMasterRowIsMissing() throws Exception {
        Map<String, Object> request = Map.of(
                "sourceType", "NON_BIM",
                "woId", "VC-2026-ETCH-001",
                "equipment", Map.of(
                        "eqId", "EQ-VAC-ETCH-1001",
                        "woId", "VC-2026-ETCH-001",
                        "fabCd", "M16",
                        "setModelNm", "VX-ETCH-300"
                ),
                "chambers", List.of(Map.of(
                        "chamberId", "CH-ETCH-B",
                        "chamberName", "Ch02 Side Pump",
                        "calculationTarget", true,
                        "modelStandard", "ETCH-LINE-S",
                        "minSpec", "42",
                        "maxSpec", "58",
                        "isSpecSkipped", false,
                        "processLarge", "ETCH",
                        "processMiddle", "Metal Etch",
                        "pipeList", List.of(Map.of(
                                "type", "PIPE",
                                "inletDiameter", "3",
                                "length", "760",
                                "quantity", "1"
                        ))
                ))
        );

        mockMvc.perform(post("/api/vc/sim/non-bim/calculate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.rows[0].conductance").value("17.88"))
                .andExpect(jsonPath("$.data.rows[0].judge").value("LOW_OUT"));
    }

    @Test
    void calculatorOptionsContainFabAndModelForApplicableSpecFiltering() throws Exception {
        mockMvc.perform(get("/api/vc/sim/calculator/options"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.modelStandards[?(@.value == 'CVD-STD-MID')].fab").isNotEmpty())
                .andExpect(jsonPath("$.modelStandards[?(@.value == 'CVD-STD-MID')].model").isNotEmpty())
                .andExpect(jsonPath("$.modelStandards[?(@.value == 'PUMP-RACK-A')].fab").value("M14"));
    }

    @Test
    void specMasterSearchReturnsAllMastersWithCurrentResponseMetadata() throws Exception {
        Map<String, Object> request = Map.of();

        mockMvc.perform(post("/api/vc/specmaster/selectcondition")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rows.length()").value(17))
                .andExpect(jsonPath("$.totalElements").value(17))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.selectedSpecId").isNotEmpty())
                .andExpect(jsonPath("$.details").isArray());
    }

    @Test
    void specMasterFilterOptionsAreProvidedByDedicatedComboApi() throws Exception {
        mockMvc.perform(get("/api/vc/specmaster/selectfilteroptions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fabIds[?(@ == 'M14')]").isNotEmpty())
                .andExpect(jsonPath("$.setModelNms[?(@ == 'LITHO-Track-4')]").isNotEmpty())
                .andExpect(jsonPath("$.operLargeCatgVals[?(@ == 'LITHO')]").isNotEmpty())
                .andExpect(jsonPath("$.chambModelNms[?(@ == 'LITHO-STD-A')]").isNotEmpty())
                .andExpect(jsonPath("$.areasByFab.M16[?(@ == 'M16A')]").isNotEmpty())
                .andExpect(jsonPath("$.makersByArea.M16A[?(@ == 'TEL')]").isNotEmpty())
                .andExpect(jsonPath("$.modelsByMaker.TEL[?(@ == 'VX-ETCH-300')]").isNotEmpty())
                .andExpect(jsonPath("$.operMidByLarge.ETCH[?(@ == 'Metal Etch')]").isNotEmpty());
    }

    @Test
    void specMasterSearchCombosUseDedicatedCodeApis() throws Exception {
        mockMvc.perform(get("/api/vc/code/getFabOptions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.value == 'M16')]").isNotEmpty());

        mockMvc.perform(get("/api/vc/code/getSpecMModelOptions").param("fabId", "M16"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.value == 'VX-ETCH-300')]").isNotEmpty())
                .andExpect(jsonPath("$[?(@.value == 'LITHO-Track-4')]").isEmpty());

        mockMvc.perform(get("/api/vc/code/getMSpecNMs")
                        .param("fabId", "M16")
                        .param("specNm", "ETCH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.value == 'M16 ETCH General')]").isNotEmpty())
                .andExpect(jsonPath("$[?(@.value == 'M15 ETCH General')]").isEmpty());
    }

    @Test
    void specNameSearchRequiresFabIdAndSpecNmParameters() throws Exception {
        mockMvc.perform(get("/api/vc/code/getMSpecNMs").param("fabId", "M16"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/vc/code/getMSpecNMs").param("specNm", "ETCH"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/vc/code/getMSpecNMs")
                        .param("fabId", " ")
                        .param("specNm", " "))
                .andExpect(status().isBadRequest());
    }

    @Test
    void specMasterSpecNameSuggestionsUseContainsSearch() throws Exception {
        mockMvc.perform(get("/api/vc/specmaster/specnames").param("keyword", "ETCH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.value == 'M16 ETCH General')]").isNotEmpty())
                .andExpect(jsonPath("$[?(@.value == 'M16 ETCH Main Chamber')]").isNotEmpty());
    }

    @Test
    void specMasterSpecNameSuggestionsReturnInitialCandidatesWithoutKeyword() throws Exception {
        mockMvc.perform(get("/api/vc/specmaster/specnames"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(10))
                .andExpect(jsonPath("$[?(@.value == 'M16 ETCH General')]").isNotEmpty());
    }

    @Test
    void specMasterDetailSaveIsVisibleThroughChildrenResponse() throws Exception {
        Map<String, Object> detail = Map.of(
                "specNm", "M14 LITHO Added Test Chamber",
                "fabId", "M14",
                "setModelNm", "LITHO-Track-4",
                "operLargeCatgVal", "LITHO",
                "operMidCatgVal", "Test",
                "chambModelNm", "LITHO-ADDED-TEST",
                "specMinVal", "41",
                "specMaxVal", "67",
                "chgrNm", "Test Owner"
        );

        mockMvc.perform(post("/api/vc/specmaster/SPEC-M14-LITHO-A/children")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(detail)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.upperCd").value("SPEC-M14-LITHO-A"));

        mockMvc.perform(get("/api/vc/specmaster/SPEC-M14-LITHO-A/children"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.specNm == 'M14 LITHO Added Test Chamber')].upperCd").value("SPEC-M14-LITHO-A"));
    }

    @Test
    void deprecatedSpecMasterLookupEndpointsAreNotExposed() throws Exception {
        mockMvc.perform(get("/api/vc/specmaster/selectpaging"))
                .andExpect(status().isMethodNotAllowed());
        mockMvc.perform(post("/api/vc/specmaster/selectpaging").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isMethodNotAllowed());
        mockMvc.perform(get("/api/vc/specmaster/selectleftpaging"))
                .andExpect(status().isMethodNotAllowed());
        mockMvc.perform(get("/api/vc/specmaster/selectcondition"))
                .andExpect(status().isMethodNotAllowed());
        mockMvc.perform(get("/api/vc/specmaster/SPEC-M16-ETCH-A/children"))
                .andExpect(status().isOk());
    }

    private static Path createTestDataDirectory() {
        try {
            Path source = Path.of("data").toAbsolutePath().normalize();
            Path target = Files.createTempDirectory("vc-be-test-data-");
            target.toFile().deleteOnExit();

            try (var files = Files.list(source)) {
                files.filter(Files::isRegularFile).forEach(file -> {
                    try {
                        Path copied = target.resolve(file.getFileName());
                        Files.copy(file, copied, StandardCopyOption.REPLACE_EXISTING);
                        copied.toFile().deleteOnExit();
                    } catch (IOException e) {
                        throw new IllegalStateException("Failed to copy mock DB fixture: " + file, e);
                    }
                });
            }
            return target;
        } catch (IOException e) {
            throw new IllegalStateException("Failed to prepare isolated mock DB fixtures.", e);
        }
    }
}
