# V/C Simulation API

이 문서는 V/C Simulation 화면에서 F/E가 호출하는 API만 정리한다.
SpecMaster 관리 API는 [SPEC_MASTER_API.md](./SPEC_MASTER_API.md)를 기준으로 본다.

## 공통 기준

| 항목 | 내용 |
| --- | --- |
| Base URL | 로컬 B/E `http://localhost:8090` |
| F/E 호출 방식 | Vite proxy 기준 `/api/...` |
| JSON naming | camelCase |
| 사용자 세션 | `state.userInfo?.user` |
| FAB 기본값 | `user.prjtCd` |
| 작업자 사번 | `user.empNo` |

## API 목록

| 업무 | Method | URL |
| --- | --- | --- |
| Non-BIM 옵션 조회 | GET | `/api/vc/sim/non-bim/options` |
| EQ ID 자동완성 | GET | `/api/vc/sim/non-bim/equipments` |
| 수기 도면 조회 | GET | `/api/vc/sim/non-bim/manual-drawings` |
| 선택 도면 Chamber 조회 | GET | `/api/vc/sim/non-bim/chambers` |
| 장비 Spec 옵션 조회 | GET | `/api/vc/sim/non-bim/equipment-spec-options` |
| Foreline 파일 다운로드 | GET | `/api/vc/sim/non-bim/foreline-drawing/download` |
| Non-BIM 계산 | POST | `/api/vc/sim/non-bim/calculate` |
| Calculator 옵션 조회 | GET | `/api/vc/sim/calculator/options` |
| Calculator 계산 | POST | `/api/vc/sim/calculator/calculate` |
| 계산 결과 저장 | POST | `/api/vc/sim/result/save` |

## 1. Non-BIM 옵션 조회

화면 진입 시 pipe type 같은 공통 옵션을 가져온다. Non-BIM의 FAB는 세션 `user.prjtCd`를 readonly로 보여주므로 `fabs`는 호환용 값이다.

### Request

```http
GET /api/vc/sim/non-bim/options
```

### Request Field

없음.

### Response

```json
{
  "fabs": [
    { "value": "M16", "label": "M16" }
  ],
  "pipeTypes": [
    { "value": "PIPE", "label": "Pipe" },
    { "value": "ELBOW", "label": "Elbow" },
    { "value": "REDUCER", "label": "Reducer" }
  ]
}
```

### Response Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `fabs` | array | N | FAB option 목록. 현재 Non-BIM 조회조건에는 직접 사용하지 않음 |
| `fabs[].value` | string | Y | FAB 코드 |
| `fabs[].label` | string | Y | FAB 표시명 |
| `pipeTypes` | array | Y | pipe grid 유형 option |
| `pipeTypes[].value` | string | Y | `PIPE`, `ELBOW`, `REDUCER` |
| `pipeTypes[].label` | string | Y | 화면 표시명 |

## 2. EQ ID 자동완성

EQ ID 입력값이 2글자 이상일 때 datalist 후보를 조회한다.

### Request

```http
GET /api/vc/sim/non-bim/equipments?keyword=EQ-VAC
```

### Request Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `keyword` | string | N | EQ ID 검색어 |

### Response

```json
[
  {
    "eqId": "EQ-VAC-ETCH-1001",
    "woId": "VC-2026-ETCH-001",
    "label": "EQ-VAC-ETCH-1001 (M16 / ETCH)",
    "raw": {
      "woId": "VC-2026-ETCH-001",
      "eqId": "EQ-VAC-ETCH-1001",
      "fabCd": "M16",
      "area": "ETCH"
    }
  }
]
```

### Response Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `eqId` | string | Y | datalist value로 사용할 장비 ID |
| `woId` | string | N | 관련 WO ID |
| `label` | string | Y | datalist 표시 문구 |
| `raw` | object | N | 원본 row 보관용. 화면 로직은 이 값에 직접 의존하지 않음 |

## 3. 수기 도면 조회

Non-BIM 화면의 `Search` 버튼 클릭 시 Manual Drawing Results grid를 조회한다.

### Request

```http
GET /api/vc/sim/non-bim/manual-drawings?fabCd=M16&eqId=EQ-VAC-ETCH-1001&woId=VC-2026-ETCH-001
```

### Request Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `fabCd` | string | Y | 세션 `user.prjtCd` |
| `eqId` | string | Y | 화면에서 입력한 EQ ID |
| `woId` | string | N | 화면에서 입력한 WO ID |

### Response

```json
[
  {
    "woId": "VC-2026-ETCH-001",
    "eqId": "EQ-VAC-ETCH-1001",
    "siteCd": "PTK",
    "siteNm": "Pyeongtaek",
    "fabCd": "M16",
    "fabNm": "M16",
    "area": "ETCH",
    "areaDetail": "BAY-12",
    "requestStatus": "Ready",
    "setModelNm": "VX-ETCH-300",
    "eqpMakerNm": "HanVac Systems",
    "operLargeCatgVal": "ETCH",
    "operMidCatgVal": "Metal Etch",
    "file": "FILE-ETCH-001",
    "fileSeq": "1",
    "fileNm": "EQ-VAC-ETCH-1001_foreline_revA.txt",
    "chamberCount": 3
  }
]
```

### Response Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `woId` | string | Y | grid row 선택 key |
| `eqId` | string | Y | 장비 ID |
| `fabCd` | string | Y | FAB 코드 |
| `siteCd`, `siteNm` | string | N | Site 정보 |
| `area`, `areaDetail` | string | N | Area 정보 |
| `requestStatus` | string | N | 업무 상태. 저장 후 화면 상태 판단에 사용 |
| `setModelNm` | string | N | 장비 model |
| `eqpMakerNm` | string | N | 장비 maker |
| `operLargeCatgVal` | string | N | 공정 대분류 |
| `operMidCatgVal` | string | N | 공정 중분류 |
| `file`, `fileSeq`, `fileNm` | string | N | Foreline 파일 다운로드 정보 |
| `chamberCount` | number | N | chamber 개수 |

## 4. 선택 도면 Chamber 조회

Manual Drawing Results에서 row를 선택하면 해당 도면의 chamber와 pipe 정보를 조회한다. F/E는 B/E의 `chamberName`을 tab 이름으로 그대로 사용한다.

### Request

```http
GET /api/vc/sim/non-bim/chambers?eqId=EQ-VAC-ETCH-1001&woId=VC-2026-ETCH-001
```

### Request Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `eqId` | string | Y | 선택 row의 EQ ID |
| `woId` | string | Y | 선택 row의 WO ID |

### Response

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

### Response Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `chamberId` | string | Y | chamber key |
| `chamberName` | string | Y | tab 표시명 |
| `modelStandard` | string | N | 선택된 model standard |
| `minSpec`, `maxSpec` | string | N | V/C 기준값 |
| `operLargeCatgVal`, `operMidCatgVal` | string | N | 공정 정보 |
| `pipeRows` | array | N | pipe 입력 row 목록 |
| `pipeRows[].pipeType` | string | Y | `PIPE`, `ELBOW`, `REDUCER` |
| `pipeRows[].inletDia` | string | N | 입구 내경 |
| `pipeRows[].pipeLength` | string | N | 길이 |
| `pipeRows[].angle` | string | N | 각도 |
| `pipeRows[].outletDia` | string | N | 출구 내경 |
| `pipeRows[].qty` | string | N | 수량 |

## 5. 장비 Spec 옵션 조회

선택 도면의 장비/model 기준으로 Model Standard option을 조회한다.

### Request

```http
GET /api/vc/sim/non-bim/equipment-spec-options?eqId=EQ-VAC-ETCH-1001&fabCd=M16&setModelNm=VX-ETCH-300&woId=VC-2026-ETCH-001
```

### Request Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `eqId` | string | N | 장비 ID |
| `fabCd` | string | N | FAB 코드 |
| `setModelNm` | string | N | 장비 model |
| `woId` | string | N | WO ID |

### Response

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

### Response Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `value` | string | Y | Model Standard 값 |
| `label` | string | Y | 화면 표시명 |
| `minSpec`, `maxSpec` | string | N | V/C 기준값 |

## 6. Foreline 파일 다운로드

Manual Drawing Results row의 download 버튼 클릭 시 호출한다.

### Request

```http
GET /api/vc/sim/non-bim/foreline-drawing/download?eqId=EQ-VAC-ETCH-1001&woId=VC-2026-ETCH-001&file=FILE-ETCH-001&fileSeq=1&fabCd=M16
```

### Request Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `eqId` | string | Y | 장비 ID |
| `woId` | string | Y | WO ID |
| `file` | string | N | 파일 key |
| `fileSeq` | string | N | 파일 sequence |
| `fabCd` | string | N | FAB 코드 |

### Response

파일 body를 반환한다.

```http
Content-Type: application/octet-stream
Content-Disposition: attachment; filename*=UTF-8''EQ-VAC-ETCH-1001_foreline_revA.txt
```

### Response Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| body | blob | Y | 다운로드 파일 |

## 7. Non-BIM 계산

선택 도면의 chamber/pipe 입력값으로 V/C를 계산한다. Non-BIM은 계산 대상 chamber에 `modelStandard`와 `minSpec` 또는 `maxSpec`가 필요하다.

### Request

```http
POST /api/vc/sim/non-bim/calculate
Content-Type: application/json
```

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
    "fabCd": "M16",
    "setModelNm": "VX-ETCH-300",
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

### Request Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `sourceType` | string | Y | `NON_BIM` |
| `woId` | string | Y | 선택 도면 WO ID |
| `search` | object | Y | 조회조건 snapshot |
| `equipment` | object | Y | 선택 도면 장비 정보 |
| `equipment.eqId` | string | Y | 장비 ID |
| `equipment.fabCd` | string | Y | FAB 코드 |
| `equipment.setModelNm` | string | N | 장비 model |
| `chambers` | array | Y | 계산할 chamber 목록 |
| `chambers[].calculationTarget` | boolean | Y | 계산 대상 여부 |
| `chambers[].modelStandard` | string | 조건부 | Non-BIM 계산 대상이면 필수 |
| `chambers[].minSpec`, `chambers[].maxSpec` | string | 조건부 | 계산 대상이면 둘 중 하나 이상 필요 |
| `chambers[].pipeList` | array | Y | pipe 입력 목록 |
| `pipeList[].type` | string | Y | `PIPE`, `ELBOW`, `REDUCER` |
| `pipeList[].inletDiameter` | string | Y | 입구 내경 |
| `pipeList[].length` | string | 조건부 | `PIPE`, `REDUCER` 필수 |
| `pipeList[].angle` | string | 조건부 | `ELBOW` 필수 |
| `pipeList[].outletDiameter` | string | 조건부 | `REDUCER` 필수 |
| `pipeList[].quantity` | string | 조건부 | `ELBOW` 필수. `PIPE`, `REDUCER`는 보통 `1` |

### Response

```json
{
  "success": true,
  "data": {
    "eqId": "EQ-VAC-ETCH-1001",
    "fabCd": "M16",
    "setModelNm": "VX-ETCH-300",
    "guid": "6cd24784-77d1-4676-ad1c-2bfb3127cea3",
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

### Response Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `success` | boolean | Y | 성공 여부 |
| `data.guid` | string | Y | B/E 계산 요청 GUID |
| `data.rows` | array | Y | 결과 row 목록 |
| `rows[].chamberId` | string | Y | chamber key |
| `rows[].chamberName` | string | Y | chamber 명 |
| `rows[].conductance` | string | Y | 계산값. 계산 제외는 `N/A` |
| `rows[].judge` | string | Y | `IN`, `HIGH_OUT`, `LOW_OUT`, `NA` |

## 8. Calculator 옵션 조회

Calculator 화면 진입 시 FAB, MODEL, Model Standard, pipe type option을 조회한다.

### Request

```http
GET /api/vc/sim/calculator/options
```

### Request Field

없음.

### Response

```json
{
  "fabs": [{ "value": "M16", "label": "M16" }],
  "models": [{ "value": "VX-ETCH-300", "label": "VX-ETCH-300" }],
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
  "pipeTypes": [{ "value": "PIPE", "label": "Pipe" }]
}
```

### Response Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `fabs` | array | Y | FAB option |
| `models` | array | Y | MODEL option |
| `modelStandards` | array | Y | Model Standard option |
| `modelStandards[].minSpec`, `modelStandards[].maxSpec` | string | N | V/C 기준값 |
| `modelStandards[].fab`, `modelStandards[].model` | string | Y | 적용 FAB/MODEL |
| `pipeTypes` | array | Y | pipe type option |

## 9. Calculator 계산

사용자가 직접 입력한 chamber/pipe 값으로 V/C를 계산한다. Calculator는 Model Standard나 Min/Max Spec이 없어도 계산할 수 있고, 이 경우 judge는 `NA`가 된다.

### Request

```http
POST /api/vc/sim/calculator/calculate
Content-Type: application/json
```

```json
{
  "sourceType": "CALCULATOR",
  "equipment": {
    "eqId": "",
    "fabCd": "M16",
    "fabNm": "M16",
    "setModelNm": "VX-ETCH-300",
    "operLargeCatgVal": "Manual",
    "operMidCatgVal": "Calculator"
  },
  "chambers": [
    {
      "seq": 1,
      "chamberId": "CALC_CHAMBER_1",
      "chamberName": "CHAMBER1",
      "calculationTarget": true,
      "modelStandard": "",
      "minSpec": "",
      "maxSpec": "",
      "isSpecSkipped": true,
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

### Request Field

Non-BIM 계산과 같은 구조를 사용한다. 차이는 아래와 같다.

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `sourceType` | string | Y | `CALCULATOR` |
| `equipment.eqId` | string | N | Calculator는 보통 빈 값 |
| `equipment.fabCd` | string | Y | 선택 FAB |
| `chambers[].modelStandard` | string | N | 없어도 계산 가능 |
| `chambers[].minSpec`, `chambers[].maxSpec` | string | N | 없어도 계산 가능 |

### Response

Non-BIM 계산과 동일한 구조다.

```json
{
  "success": true,
  "data": {
    "eqId": "CALCULATOR-MANUAL",
    "fabCd": "M16",
    "setModelNm": "VX-ETCH-300",
    "guid": "40798311-a53a-4184-bcb9-5aab25ebc623",
    "rows": [
      {
        "chamberId": "CALC_CHAMBER_1",
        "chamberName": "CHAMBER1",
        "conductance": "9.81",
        "judge": "NA"
      }
    ]
  }
}
```

### Response Field

Non-BIM 계산 Response Field와 동일하다.

## 10. 계산 결과 저장

결과 팝업의 Save 버튼 클릭 시 호출한다. Non-BIM 결과 중 `HIGH_OUT` 또는 `LOW_OUT`이 있으면 F/E는 저장 전에 기안 첨부 정보를 함께 보낸다.

### Request

```http
POST /api/vc/sim/result/save
Content-Type: application/json
```

```json
{
  "sourceType": "NON_BIM",
  "basicInfo": {
    "eqId": "EQ-VAC-ETCH-1001",
    "fabCd": "M16",
    "setModelNm": "VX-ETCH-300",
    "woId": "VC-2026-ETCH-001"
  },
  "rows": [
    {
      "chamberId": "CH-ETCH-A",
      "chamberName": "Ch01 Main Process",
      "calculationTarget": true,
      "conductance": "15.4",
      "judge": "HIGH_OUT"
    }
  ],
  "draft": {
    "title": "Spec Out review request",
    "attachmentName": "review.pdf",
    "comment": "Please review HIGH_OUT chamber."
  }
}
```

### Request Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `sourceType` | string | Y | `NON_BIM` 또는 `CALCULATOR` |
| `basicInfo` | object | Y | 결과 팝업 상단 정보 |
| `rows` | array | Y | 저장할 결과 row |
| `rows[].judge` | string | Y | `IN`, `HIGH_OUT`, `LOW_OUT`, `NA` |
| `draft` | object | 조건부 | Non-BIM Spec Out 저장 시 필요 |
| `draft.title` | string | 조건부 | 기안 제목 |
| `draft.attachmentName` | string | 조건부 | 첨부명 |
| `draft.comment` | string | N | 기안 comment |

### Response

```json
{
  "success": true,
  "data": {
    "savedId": "VC-SAVE-6a8f80df-03c6-40fe-a321-2b6cb745b01c",
    "sourceType": "NON_BIM",
    "savedAt": "2026-06-18T01:20:31.123+09:00",
    "rowCount": 1,
    "draftAttached": true,
    "nextStatus": "Draft Attached"
  }
}
```

### Response Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `success` | boolean | Y | 성공 여부 |
| `data.savedId` | string | Y | 저장 ID |
| `data.sourceType` | string | Y | 저장 출처 |
| `data.savedAt` | string | Y | 저장 시각 |
| `data.rowCount` | number | Y | 저장 row 수 |
| `data.draftAttached` | boolean | Y | 기안 첨부 여부 |
| `data.nextStatus` | string | Y | 저장 후 화면 상태. `Saved` 또는 `Draft Attached` |

## 공통 코드 값

### Judge

| Code | 설명 |
| --- | --- |
| `IN` | Spec 범위 내 |
| `HIGH_OUT` | 상한 초과 |
| `LOW_OUT` | 하한 미달 |
| `NA` | Spec 없음 또는 계산 제외 |

### Pipe Type별 필수 입력

| Type | inletDiameter | length | angle | outletDiameter | quantity |
| --- | --- | --- | --- | --- | --- |
| `PIPE` | 필수 | 필수 | - | - | `1` |
| `ELBOW` | 필수 | - | 필수 | - | 필수 |
| `REDUCER` | 필수 | 필수 | - | 필수 | `1` |

## F/E 미사용 / Legacy API 기록

아래 API들은 2026-06-22 기준으로 B/E에는 열려 있지만 최신 F/E 화면 어댑터와 saga에서 직접 호출하지 않는다.

| 구분 | Method | URL | 이유 |
| --- | --- | --- | --- |
| [F/E 미사용 - Legacy] | POST | `/api/vc/calculate` | 최신 F/E는 `/api/vc/sim/non-bim/calculate`, `/api/vc/sim/calculator/calculate`를 사용한다. |
| [F/E 미사용 - Legacy] | GET | `/api/vc/{fabId}/requests` | 현재 F/E에는 FAB별 request header 목록 조회 화면이 없다. |

참고: `GET /api/vc/specs`는 SpecMaster 필터 옵션 API 실패 시 legacy fallback으로 호출될 수 있으므로 완전 미사용으로 분류하지 않는다.
