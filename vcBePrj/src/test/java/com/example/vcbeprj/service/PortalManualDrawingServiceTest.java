package com.example.vcbeprj.service;

import com.example.vcbeprj.domain.PortalManualDrawing;
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
class PortalManualDrawingServiceTest {

    private static final Path TEST_DATA_PATH = createTestDataDirectory();

    @DynamicPropertySource
    static void mockDbProperties(DynamicPropertyRegistry registry) {
        registry.add("vc.mock-db.base-path", () -> TEST_DATA_PATH.toString());
    }

    @Autowired
    private PortalManualDrawingService portalService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MockMvc mockMvc;

    @Test
    void manualDrawingResponseUsesBusinessKeyWithoutGenericId() {
        PortalManualDrawing drawing = portalService.findByBusinessKey(
                "EQ-VAC-ETCH-1001",
                "VC-2026-ETCH-001"
        );

        JsonNode response = objectMapper.valueToTree(drawing);

        assertThat(response.has("id")).isFalse();
        assertThat(response.path("eqId").asText()).isEqualTo("EQ-VAC-ETCH-1001");
        assertThat(response.path("constructionNo").asText()).isEqualTo("VC-2026-ETCH-001");
        assertThat(response.path("drawingKey").asText()).isEqualTo("DWG-ETCH-001");
    }

    @Test
    void chamberLookupUsesEquipmentAndConstructionNumber() {
        List<PortalManualDrawing.Chamber> chambers = portalService.getDrawingChambers(
                "EQ-VAC-ETCH-1001",
                "VC-2026-ETCH-001"
        );

        assertThat(chambers)
                .extracting(PortalManualDrawing.Chamber::chamberName)
                .containsExactly("Ch01 Main Process", "Ch02 Side Pump", "Ch03 Exhaust");
    }

    @Test
    void manualDrawingApiDoesNotExposeDatabaseDrawingId() throws Exception {
        mockMvc.perform(get("/api/vc/sim/non-bim/manual-drawings")
                        .queryParam("fab", "M16")
                        .queryParam("eqId", "EQ-VAC-ETCH-1001")
                        .queryParam("constructionNo", "VC-2026-ETCH-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").doesNotExist())
                .andExpect(jsonPath("$[0].eqId").value("EQ-VAC-ETCH-1001"))
                .andExpect(jsonPath("$[0].constructionNo").value("VC-2026-ETCH-001"))
                .andExpect(jsonPath("$[0].drawingKey").value("DWG-ETCH-001"));
    }

    @Test
    void calculationUsesRequestedSpecSnapshotWhenMasterRowIsMissing() throws Exception {
        Map<String, Object> request = Map.of(
                "sourceType", "NON_BIM",
                "constructionNo", "VC-2026-ETCH-001",
                "equipment", Map.of(
                        "eqId", "EQ-VAC-ETCH-1001",
                        "constructionNo", "VC-2026-ETCH-001",
                        "fab", "M16",
                        "model", "VX-ETCH-300"
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
                .andExpect(jsonPath("$.modelStandards[?(@.value == 'CVD-STD-MID')].fab").value("M15"))
                .andExpect(jsonPath("$.modelStandards[?(@.value == 'CVD-STD-MID')].model").value("CV-Pro-12"))
                .andExpect(jsonPath("$.modelStandards[?(@.value == 'PUMP-RACK-A')].fab").value("M14"));
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
