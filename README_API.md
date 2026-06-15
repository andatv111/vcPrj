# V/C Simulation API Contract

이 문서는 F/E와 B/E가 함께 보는 공식 API 계약입니다. 화면 배치는 F/E 책임이고, 콤보/그리드/계산에 필요한 업무 데이터는 B/E API에서 제공합니다.

## 공통 원칙

- Local B/E base URL은 `http://localhost:8090`입니다.
- F/E는 Vite proxy를 통해 `/api/...` 상대 경로로 호출합니다.
- JSON 필드명은 Java DTO/record의 camelCase 이름을 그대로 사용합니다.
- 업무 키는 DB/테이블 기준 `WO_ID`, JSON 기준 `woId`입니다.
- `scripts/verify-vc-calculation.mjs`는 API가 아니라 F/E 업무 규칙 검증 스크립트입니다. 운영 endpoint 계약에는 포함되지 않습니다.
- 설계포탈은 외부 시스템이므로 preview B/E에서는 `DESIGN_PORTAL_MANUAL_DRAWING.txt` mock table로 query 결과를 모사합니다.
- 파일 보조키는 `file`, `fileSeq`입니다. 도면/Chamber/Pipe 관계의 업무 key는 `eqId + woId`입니다.

## 공통 에러

F/E는 HTTP error body가 문자열이든 객체든 사용자에게 읽히는 메시지로 변환합니다. B/E는 가능한 한 `message`를 사람이 읽을 수 있는 문장으로 내려줍니다.

```json
{
  "success": false,
  "message": "Design Portal drawing not found.",
  "errorCode": "VC_DRAWING_NOT_FOUND"
}
```

## API 목록

| 기능 | Method | URL | 핵심 key |
| --- | --- | --- | --- |
| Non-BIM 옵션 | GET | `/api/vc/sim/non-bim/options` | `fabs`, `pipeTypes` |
| EQ ID 자동완성 | GET | `/api/vc/sim/non-bim/equipments` | `keyword` |
| 수기도면 조회 | GET | `/api/vc/sim/non-bim/manual-drawings` | `fabCd`, `eqId`, `woId` |
| 선택 도면 Chamber 조회 | GET | `/api/vc/sim/non-bim/chambers` | `eqId`, `woId` |
| 장비 Spec 옵션 | GET | `/api/vc/sim/non-bim/equipment-spec-options` | `eqId`, `fabCd`, `setModelNm`, `woId` |
| Foreline 다운로드 | GET | `/api/vc/sim/non-bim/foreline-drawing/download` | `eqId`, `woId`, `file`, `fileSeq` |
| Non-BIM 계산 | POST | `/api/vc/sim/non-bim/calculate` | `equipment`, `chambers` |
| Calculator 옵션 | GET | `/api/vc/sim/calculator/options` | `fabs`, `models`, `modelStandards`, `pipeTypes` |
| Calculator 계산 | POST | `/api/vc/sim/calculator/calculate` | `equipment`, `chambers` |
| 결과 저장 | POST | `/api/vc/sim/result/save` | `sourceType`, `basicInfo`, `rows`, `draft` |

## 1. Non-BIM 옵션

`GET /api/vc/sim/non-bim/options`

```json
{
  "fabs": [
    { "value": "M14", "label": "M14" },
    { "value": "M15", "label": "M15" },
    { "value": "M16", "label": "M16" }
  ],
  "pipeTypes": [
    { "value": "PIPE", "label": "Pipe" },
    { "value": "ELBOW", "label": "Elbow" },
    { "value": "REDUCER", "label": "Reducer" }
  ]
}
```

FAB 콤보는 화면 기능이므로 빈 배열이 내려오면 사용자가 검색을 시작할 수 없습니다. B/E는 설계포탈 mock table에서 우선 조회하고, 비어 있으면 `VCW_VC_SPEC_MST.FAB_ID` 기준으로 fallback 합니다.

## 2. EQ ID 자동완성

`GET /api/vc/sim/non-bim/equipments?keyword=EQ-VAC`

```json
[
  {
    "eqId": "EQ-VAC-ETCH-1001",
    "woId": "VC-2026-ETCH-001",
    "label": "EQ-VAC-ETCH-1001 (M16 / ETCH)",
    "raw": {}
  }
]
```

`raw`는 디버그와 확장용입니다. 화면 datalist는 `value=eqId`, `label=label`만 사용합니다.

## 3. 수기도면 조회

`GET /api/vc/sim/non-bim/manual-drawings?fabCd=M16&eqId=EQ-VAC-ETCH-1001&woId=VC-2026-ETCH-001`

| Query | 필수 | 설명 |
| --- | --- | --- |
| `fabCd` | 선택 | FAB 코드 |
| `eqId` | 필수 | 장비 ID |
| `woId` | 선택 | WO ID |

응답 row는 설계포탈 query 컬럼명을 camelCase로 변환한 형태입니다.

| 필드 | 설명 |
| --- | --- |
| `woId` | `WO_ID`, 화면 업무 key |
| `eqId` | 장비 ID |
| `siteCd`, `siteNm` | Site 코드/명 |
| `fabCd`, `fabNm` | FAB 코드/명 |
| `area`, `areaDetail` | Area 정보 |
| `chgType1`, `chgType1Nm` | 변경 유형 코드/명 |
| `catNm` | 설비 분류명 |
| `crteDt`, `crteId`, `crteIdNm` | 생성 일자/사용자 |
| `file`, `fileSeq`, `fileNm`, `fileOrgNm`, `fileDisSize` | 설계포탈 파일 정보 |
| `requestStatus` | 화면 계산 잠금 판단 상태 |
| `setModelNm`, `eqpMakerNm` | 장비 모델/메이커 |
| `operLargeCatgVal`, `operMidCatgVal` | 공정 대/중분류 |
| `chamberCount`, `chambers`, `specOptions` | 화면 편집과 spec 선택 보조 데이터 |

## 4. 선택 도면 Chamber 조회

`GET /api/vc/sim/non-bim/chambers?eqId=EQ-VAC-ETCH-1001&woId=VC-2026-ETCH-001`

```json
[
  {
    "chamberId": "CH-ETCH-A",
    "chamberName": "Ch01 Main Process",
    "modelStandard": "ETCH-LINE-A",
    "minSpec": "35",
    "maxSpec": "72",
    "operLargeCatgVal": "ETCH",
    "operMidCatgVal": "Metal Etch",
    "pipeRows": [
      {
        "pipeType": "PIPE",
        "inletDia": "4",
        "pipeLength": "1200",
        "angle": "",
        "outletDia": "",
        "qty": "1"
      }
    ]
  }
]
```

F/E는 조회 DTO의 `pipeRows`를 계산 DTO의 `pipeList`로 명시적으로 변환합니다.

## 5. 장비 Spec 옵션

`GET /api/vc/sim/non-bim/equipment-spec-options?eqId=EQ-VAC-ETCH-1001&fabCd=M16&setModelNm=VX-ETCH-300&woId=VC-2026-ETCH-001`

```json
[
  {
    "value": "ETCH-LINE-A",
    "label": "ETCH-LINE-A / General",
    "minSpec": "35",
    "maxSpec": "72"
  }
]
```

Non-BIM은 Model Standard와 Min/Max Spec이 있어야 산출대상이 됩니다. 옵션이 없으면 해당 Chamber의 산출대상은 false가 됩니다.

## 6. Foreline 다운로드

`GET /api/vc/sim/non-bim/foreline-drawing/download?eqId=EQ-VAC-ETCH-1001&woId=VC-2026-ETCH-001&file=FILE-ETCH-001&fileSeq=1`

| Query | 필수 | 설명 |
| --- | --- | --- |
| `eqId` | 필수 | 장비 ID |
| `woId` | 필수 | WO ID |
| `file` | 선택 | 설계포탈 파일 보조키 |
| `fileSeq` | 선택 | 설계포탈 파일 순번 |
| `fabCd` | 선택 | 보조 조회 조건 |

응답은 파일 body이며 `Content-Disposition`의 filename을 사용합니다.

## 7. 계산 요청

Non-BIM과 Calculator는 같은 계산 endpoint 구조를 공유하지만 검증 규칙이 다릅니다.

### Non-BIM 계산

`POST /api/vc/sim/non-bim/calculate`

```json
{
  "sourceType": "NON_BIM",
  "woId": "VC-2026-ETCH-001",
  "search": {
    "fabCd": "M16",
    "eqId": "EQ-VAC-ETCH-1001",
    "woId": "VC-2026-ETCH-001"
  },
  "equipment": {
    "eqId": "EQ-VAC-ETCH-1001",
    "woId": "VC-2026-ETCH-001",
    "siteCd": "PTK",
    "siteNm": "Pyeongtaek",
    "fabCd": "M16",
    "fabNm": "M16",
    "area": "ETCH",
    "areaDetail": "BAY-12",
    "chgType1": "New Install",
    "chgType1Nm": "New Install",
    "catNm": "Etcher",
    "setModelNm": "VX-ETCH-300",
    "modelStandard": "ETCH-LINE-A",
    "eqpMakerNm": "HanVac Systems",
    "operLargeCatgVal": "ETCH",
    "operMidCatgVal": "Metal Etch"
  },
  "chambers": [
    {
      "seq": 1,
      "chamberId": "CH-ETCH-A",
      "chamberName": "Ch01 Main Process",
      "calculationTarget": true,
      "modelStandard": "ETCH-LINE-A",
      "minSpec": "35",
      "maxSpec": "72",
      "isSpecSkipped": false,
      "processLarge": "ETCH",
      "processMiddle": "Metal Etch",
      "pipeList": [
        {
          "seq": 1,
          "type": "PIPE",
          "inletDiameter": "4",
          "length": "1200",
          "angle": "",
          "outletDiameter": "",
          "quantity": "1"
        }
      ]
    }
  ]
}
```

### Calculator 계산

`POST /api/vc/sim/calculator/calculate`

Calculator는 `modelStandard`, `minSpec`, `maxSpec`가 비어 있어도 배관 필수값이 있으면 요청할 수 있습니다.

```json
{
  "sourceType": "CALCULATOR",
  "equipment": {
    "eqId": "",
    "fab": "M15",
    "model": "CV-Pro-12",
    "processLarge": "Manual",
    "processMiddle": "Calculator"
  },
  "chambers": [
    {
      "seq": 1,
      "chamberName": "CHAMBER1",
      "calculationTarget": true,
      "modelStandard": "",
      "minSpec": "",
      "maxSpec": "",
      "isSpecSkipped": true,
      "processLarge": "Manual",
      "processMiddle": "Calculator",
      "pipeList": [
        {
          "seq": 1,
          "type": "PIPE",
          "inletDiameter": "3",
          "length": "760",
          "quantity": "1"
        }
      ]
    }
  ]
}
```

## 8. 계산 응답

```json
{
  "success": true,
  "data": {
    "eqId": "EQ-VAC-ETCH-1001",
    "fabCd": "M16",
    "setModelNm": "VX-ETCH-300",
    "guid": "VC-GUID-001",
    "rows": [
      {
        "id": "RESULT-CH-ETCH-A",
        "chamberId": "CH-ETCH-A",
        "chamberName": "Ch01 Main Process",
        "confirmFlag": "N",
        "processLarge": "ETCH",
        "processMiddle": "Metal Etch",
        "modelStandard": "ETCH-LINE-A",
        "minSpec": "35",
        "maxSpec": "72",
        "conductance": "15.4",
        "judge": "IN"
      }
    ]
  }
}
```

| judge | 의미 |
| --- | --- |
| `IN` | Spec 범위 안 |
| `HIGH_OUT` | 상한 초과 |
| `LOW_OUT` | 하한 미달 |
| `NA` | 산출 제외 또는 spec 없음 |

Calculator에서 `calculationTarget: true`인 행은 spec이 없어도 B/E conductance 계산값을 표시하고, 판정만 `judge: "NA"`로 정규화합니다. `calculationTarget: false`인 행은 배관값이 있어도 산출 제외이므로 `conductance: "N/A"`, `judge: "NA"`로 표시합니다.

## 9. Calculator 옵션

`GET /api/vc/sim/calculator/options`

```json
{
  "fabs": [{ "value": "M15", "label": "M15" }],
  "models": [{ "value": "CV-Pro-12", "label": "CV-Pro-12" }],
  "modelStandards": [
    {
      "value": "CVD-STD-MID",
      "label": "CVD-STD-MID / Normal",
      "minSpec": "40",
      "maxSpec": "78",
      "fab": "M15",
      "model": "CV-Pro-12"
    }
  ],
  "pipeTypes": [
    { "value": "PIPE", "label": "Pipe" },
    { "value": "ELBOW", "label": "Elbow" },
    { "value": "REDUCER", "label": "Reducer" }
  ]
}
```

F/E는 `fab + model` 조합으로 `modelStandards`를 필터링합니다. 각 Chamber 탭의 선택값은 독립 상태입니다.

## 10. 결과 저장

`POST /api/vc/sim/result/save`

```json
{
  "sourceType": "NON_BIM",
  "basicInfo": {
    "fabCd": "M16",
    "setModelNm": "VX-ETCH-300",
    "eqId": "EQ-VAC-ETCH-1001",
    "woId": "VC-2026-ETCH-001"
  },
  "rows": [],
  "draft": {
    "title": "V/C Spec Out 검토 요청",
    "comment": "Spec Out 결과 확인 요청",
    "attachmentName": "review.pdf"
  }
}
```

현재 preview B/E는 저장 결과 mock 응답을 반환합니다. 실제 첨부 저장 방식은 별도 파일 업로드 API 후 `attachmentId` 전달 방식 또는 `multipart/form-data` 방식 중 하나로 확정해야 합니다.
