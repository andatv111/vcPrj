package com.example.vcbeprj.dto;

import java.util.List;
import java.util.Map;

public record VcSimSaveRequest(
        String sourceType,
        Map<String, Object> basicInfo,
        List<Map<String, Object>> rows,
        Map<String, Object> draft
) {
}
