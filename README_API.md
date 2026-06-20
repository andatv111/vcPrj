# V/C Simulation API

이 문서는 F/E 개발자가 B/E 테이블이나 쿼리 구조를 몰라도 화면 개발을 할 수 있도록 정리한 API 명세입니다.

공통 기준:

| 항목 | 내용 |
| --- | --- |
| Base URL | 로컬 B/E `http://localhost:8090` |
| F/E 호출 방식 | Vite proxy 기준 `/api/...` 로 호출 |
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
| SpecMaster FAB 공통코드 | GET | `/api/commcode/comm-code-list?mstCd=VC_FAB_ID&sysId=VC` |
| SpecMaster 필터 옵션 | GET | `/api/vc/specmaster/selectfilteroptions` |
| SpecMaster Master 조회 | GET | `/api/vc/specmaster/selectleftpaging` |
| SpecMaster Detail 조회 | GET | `/api/vc/specmaster/{specId}/children` |
| SpecMaster Master 신규 | POST | `/api/vc/specmaster` |
| SpecMaster Detail 신규 | POST | `/api/vc/specmaster/{specId}/children` |
| SpecMaster 수정 | PATCH | `/api/vc/specmaster/{specId}` |
| SpecMaster 삭제 | DELETE | `/api/vc/specmaster/{specId}` |

## 1. Non-BIM 옵션 조회

BIM/5D 미적용 Fab 화면 진입 시 pipe type 같은 화면 옵션을 조회합니다.

Non-BIM 화면의 FAB 조회조건은 콤보가 아니라 세션 `user.prjtCd` 값을 readonly input으로 표시합니다. 따라서 이 API의 `fabs`는 현재 화면 필수값은 아니지만, 기존 호환성을 위해 유지됩니다.

### Request

Query 없음.

```http
GET /api/vc/sim/non-bim/options
```

### Response

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

### Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `fabs` | array | N | FAB option 목록. Non-BIM 조회조건에는 현재 직접 사용하지 않음 |
| `fabs[].value` | string | Y | FAB 코드 |
| `fabs[].label` | string | Y | FAB 표시명 |
| `pipeTypes` | array | Y | pipe grid에서 사용하는 배관 유형 option |
| `pipeTypes[].value` | string | Y | `PIPE`, `ELBOW`, `REDUCER` |
| `pipeTypes[].label` | string | Y | 화면 표시명 |

## 2. EQ ID 자동완성

Non-BIM 화면의 EQ ID 입력 시 datalist 후보를 조회합니다.

F/E는 EQ ID가 2글자 이상 입력되었을 때 호출합니다.

### Request

```http
GET /api/vc/sim/non-bim/equipments?keyword=EQ-VAC
```

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

### Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `eqId` | string | Y | datalist value로 사용할 장비 ID |
| `woId` | string | N | 관련 WO ID |
| `label` | string | Y | datalist에 표시할 문구 |
| `raw` | object | N | 원본 row 보관용. 화면 개발은 이 값에 의존하지 않음 |

## 3. 수기 도면 조회

Non-BIM 화면의 `Search` 버튼 클릭 시 Manual Drawing Results grid를 조회합니다.

F/E 동작:

- `fabCd`는 세션 `user.prjtCd` 값을 보냅니다.
- `eqId`는 필수입니다.
- `woId`는 선택 검색조건입니다.

### Request

```http
GET /api/vc/sim/non-bim/manual-drawings?fabCd=M16&eqId=EQ-VAC-ETCH-1001&woId=VC-2026-ETCH-001
```

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `fabCd` | string | Y | 세션 `user.prjtCd` 값 |
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
    "chgType1": "New Install",
    "chgType1Nm": "New Install",
    "catNm": "Etcher",
    "crteDt": "2026-05-28",
    "crteId": "preview",
    "crteIdNm": "K. Lee",
    "file": "FILE-ETCH-001",
    "fileSeq": "1",
    "fileNm": "EQ-VAC-ETCH-1001_foreline_revA.txt",
    "fileOrgNm": "EQ-VAC-ETCH-1001_foreline_revA.txt",
    "fileDisSize": "",
    "requestStatus": "Ready",
    "setModelNm": "VX-ETCH-300",
    "eqpMakerNm": "HanVac Systems",
    "operLargeCatgVal": "ETCH",
    "operMidCatgVal": "Metal Etch",
    "chamberCount": 3
  }
]
```

### Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `woId` | string | Y | grid row 선택 key |
| `eqId` | string | Y | 장비 ID |
| `siteCd` | string | N | Site 코드 |
| `siteNm` | string | N | Site 명 |
| `fabCd` | string | Y | FAB 코드 |
| `fabNm` | string | N | FAB 명 |
| `area` | string | N | Area |
| `areaDetail` | string | N | Area 상세 |
| `chgType1` | string | N | 변경 유형 코드 |
| `chgType1Nm` | string | N | 변경 유형 명 |
| `catNm` | string | N | 장비 category |
| `crteDt` | string | N | 생성일 |
| `crteId` | string | N | 생성자 ID |
| `crteIdNm` | string | N | 생성자 명 |
| `file` | string | N | 파일 key |
| `fileSeq` | string | N | 파일 sequence |
| `fileNm` | string | N | 파일명 |
| `fileOrgNm` | string | N | 원본 파일명 |
| `fileDisSize` | string | N | 파일 크기 표시값 |
| `requestStatus` | string | N | 도면 업무 상태. Calculate 표시/저장 상태 판단에 사용 |
| `setModelNm` | string | N | 장비 model 명 |
| `eqpMakerNm` | string | N | 장비 maker |
| `operLargeCatgVal` | string | N | 공정 대분류 |
| `operMidCatgVal` | string | N | 공정 중분류 |
| `chamberCount` | number | N | chamber 개수 |

## 4. 선택 도면 Chamber 조회

Manual Drawing Results에서 row를 선택하면 해당 도면의 chamber와 pipe 정보를 조회합니다.

F/E는 B/E에서 내려준 `chamberName`을 그대로 tab 이름으로 사용합니다. 사용자가 새로 추가한 chamber만 `CHAMBER{n}`으로 자동 번호를 붙입니다.

### Request

```http
GET /api/vc/sim/non-bim/chambers?eqId=EQ-VAC-ETCH-1001&woId=VC-2026-ETCH-001
```

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

### Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `chamberId` | string | Y | chamber key |
| `chamberName` | string | Y | tab 표시명 |
| `modelStandard` | string | N | 선택된 model standard |
| `minSpec` | string | N | 최소 spec |
| `maxSpec` | string | N | 최대 spec |
| `operLargeCatgVal` | string | N | 공정 대분류 |
| `operMidCatgVal` | string | N | 공정 중분류 |
| `pipeRows` | array | N | pipe 입력 row 목록 |
| `pipeRows[].pipeType` | string | Y | `PIPE`, `ELBOW`, `REDUCER` |
| `pipeRows[].inletDia` | string | N | 입구 내경 |
| `pipeRows[].pipeLength` | string | N | 길이 |
| `pipeRows[].angle` | string | N | 각도 |
| `pipeRows[].outletDia` | string | N | 출구 내경 |
| `pipeRows[].qty` | string | N | 수량 |

## 5. 장비 Spec 옵션 조회

선택 도면의 장비/model 기준으로 Model Standard 옵션을 조회합니다.

### Request

```http
GET /api/vc/sim/non-bim/equipment-spec-options?eqId=EQ-VAC-ETCH-1001&fabCd=M16&setModelNm=VX-ETCH-300&woId=VC-2026-ETCH-001
```

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `eqId` | string | N | 장비 ID |
| `fabCd` | string | N | FAB 코드 |
| `setModelNm` | string | N | 장비 model 명 |
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

### Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `value` | string | Y | Model Standard 값 |
| `label` | string | Y | 화면 표시명 |
| `minSpec` | string | N | 최소 spec |
| `maxSpec` | string | N | 최대 spec |

## 6. Foreline 파일 다운로드

Manual Drawing Results row의 download 버튼 클릭 시 호출합니다.

### Request

```http
GET /api/vc/sim/non-bim/foreline-drawing/download?eqId=EQ-VAC-ETCH-1001&woId=VC-2026-ETCH-001&file=FILE-ETCH-001&fileSeq=1&fabCd=M16
```

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `eqId` | string | Y | 장비 ID |
| `woId` | string | Y | WO ID |
| `file` | string | N | 파일 key |
| `fileSeq` | string | N | 파일 sequence |
| `fabCd` | string | N | FAB 코드 |

### Response

파일 body를 반환합니다.

```http
Content-Type: application/octet-stream
Content-Disposition: attachment; filename*=UTF-8''EQ-VAC-ETCH-1001_foreline_revA.txt
```

F/E는 blob으로 받아 브라우저 다운로드를 실행합니다.

## 7. Non-BIM 계산

Non-BIM 화면에서 선택된 도면과 chamber/pipe 입력값으로 V/C를 계산합니다.

Non-BIM은 계산 대상 chamber에 `modelStandard`와 `minSpec` 또는 `maxSpec`가 필요합니다.

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

### Request Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `sourceType` | string | Y | `NON_BIM` |
| `woId` | string | Y | 선택 도면 WO ID |
| `search` | object | Y | 조회조건 snapshot |
| `search.fabCd` | string | Y | 세션 `user.prjtCd` |
| `search.eqId` | string | Y | 검색 EQ ID |
| `search.woId` | string | N | 검색 WO ID |
| `equipment` | object | Y | 선택 도면 장비 정보 |
| `equipment.eqId` | string | Y | 장비 ID |
| `equipment.woId` | string | Y | WO ID |
| `equipment.fabCd` | string | Y | FAB 코드 |
| `equipment.setModelNm` | string | N | 장비 model 명 |
| `equipment.operLargeCatgVal` | string | N | 공정 대분류 |
| `equipment.operMidCatgVal` | string | N | 공정 중분류 |
| `chambers` | array | Y | 계산할 chamber 목록 |
| `chambers[].seq` | number | Y | chamber 순서 |
| `chambers[].chamberId` | string | N | chamber key |
| `chambers[].chamberName` | string | Y | chamber 명 |
| `chambers[].calculationTarget` | boolean | Y | 계산 대상 여부 |
| `chambers[].modelStandard` | string | 조건부 | Non-BIM 계산 대상이면 필수 |
| `chambers[].minSpec` | string | 조건부 | Non-BIM 계산 대상이면 `minSpec` 또는 `maxSpec` 중 하나 필요 |
| `chambers[].maxSpec` | string | 조건부 | Non-BIM 계산 대상이면 `minSpec` 또는 `maxSpec` 중 하나 필요 |
| `chambers[].isSpecSkipped` | boolean | N | spec 미적용 여부 |
| `chambers[].processLarge` | string | N | 공정 대분류 |
| `chambers[].processMiddle` | string | N | 공정 중분류 |
| `chambers[].pipeList` | array | Y | pipe 입력 목록 |
| `pipeList[].seq` | number | Y | pipe row 순서 |
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
| `data.eqId` | string | Y | 계산 대상 장비 ID |
| `data.fabCd` | string | Y | FAB 코드 |
| `data.setModelNm` | string | N | 장비 model 명 |
| `data.guid` | string | Y | B/E 계산 요청 GUID |
| `data.rows` | array | Y | 결과 row 목록 |
| `rows[].id` | string | Y | F/E 결과 grid row key |
| `rows[].chamberId` | string | Y | chamber key |
| `rows[].chamberName` | string | Y | chamber 명 |
| `rows[].confirmFlag` | string | N | 확인 여부. 기본 `N` |
| `rows[].processLarge` | string | N | 공정 대분류 |
| `rows[].processMiddle` | string | N | 공정 중분류 |
| `rows[].modelStandard` | string | N | Model Standard |
| `rows[].minSpec` | string | N | 최소 spec |
| `rows[].maxSpec` | string | N | 최대 spec |
| `rows[].conductance` | string | Y | 계산값. 계산 제외는 `N/A` |
| `rows[].judge` | string | Y | `IN`, `HIGH_OUT`, `LOW_OUT`, `NA` |

## 8. Calculator 옵션 조회

Calculator 화면 진입 시 FAB, MODEL, Model Standard, pipe type option을 조회합니다.

F/E 동작:

- FAB 콤보는 유지합니다.
- 최초 진입 시 세션 `user.prjtCd`를 FAB 초기값으로 선택합니다.
- 사용자는 FAB를 변경할 수 있습니다.
- 추후 잠금이 필요하면 FAB `SelectField`의 `readOnly={false}`를 `true`로 바꿉니다.

### Request

```http
GET /api/vc/sim/calculator/options
```

Query 없음.

### Response

```json
{
  "fabs": [
    { "value": "M14", "label": "M14" },
    { "value": "M15", "label": "M15" },
    { "value": "M16", "label": "M16" }
  ],
  "models": [
    { "value": "CV-Pro-12", "label": "CV-Pro-12" },
    { "value": "VX-ETCH-300", "label": "VX-ETCH-300" }
  ],
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

### Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `fabs` | array | Y | FAB 콤보 option |
| `models` | array | Y | MODEL 콤보 option |
| `modelStandards` | array | Y | Model Standard option |
| `modelStandards[].value` | string | Y | Model Standard 값 |
| `modelStandards[].label` | string | Y | 화면 표시명 |
| `modelStandards[].minSpec` | string | N | 최소 spec |
| `modelStandards[].maxSpec` | string | N | 최대 spec |
| `modelStandards[].fab` | string | Y | 적용 FAB |
| `modelStandards[].model` | string | Y | 적용 MODEL |
| `pipeTypes` | array | Y | pipe type option |

## 9. Calculator 계산

Calculator 화면에서 사용자가 직접 입력한 chamber/pipe 값으로 V/C를 계산합니다.

Calculator는 Model Standard나 Min/Max Spec이 없어도 계산할 수 있습니다. 이 경우 conductance는 계산하고 judge는 `NA`로 표시합니다.

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
      "processLarge": "Manual",
      "processMiddle": "Calculator",
      "pipeList": [
        {
          "seq": 1,
          "type": "PIPE",
          "inletDiameter": "3",
          "length": "760",
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
| `sourceType` | string | Y | `CALCULATOR` |
| `equipment` | object | Y | Calculator 선택 장비 조건 |
| `equipment.eqId` | string | N | Calculator는 보통 빈 값 |
| `equipment.fabCd` | string | Y | 선택 FAB. 초기값은 세션 `user.prjtCd` |
| `equipment.fabNm` | string | N | FAB 표시명 |
| `equipment.setModelNm` | string | N | 선택 MODEL |
| `equipment.operLargeCatgVal` | string | N | 기본 `Manual` |
| `equipment.operMidCatgVal` | string | N | 기본 `Calculator` |
| `chambers` | array | Y | chamber 입력 목록 |
| `chambers[].modelStandard` | string | N | Calculator는 없어도 계산 가능 |
| `chambers[].minSpec` | string | N | 없어도 계산 가능 |
| `chambers[].maxSpec` | string | N | 없어도 계산 가능 |
| `chambers[].pipeList` | array | Y | pipe 입력 목록 |

나머지 chamber/pipe field는 Non-BIM 계산 request와 동일합니다.

### Response

Non-BIM 계산과 동일한 구조입니다.

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
        "id": "RESULT-CALC_CHAMBER_1",
        "chamberId": "CALC_CHAMBER_1",
        "chamberName": "CHAMBER1",
        "confirmFlag": "N",
        "processLarge": "Manual",
        "processMiddle": "Calculator",
        "modelStandard": "",
        "minSpec": "",
        "maxSpec": "",
        "conductance": "9.81",
        "judge": "NA"
      }
    ]
  }
}
```

## 10. 계산 결과 저장

결과 팝업의 Save 버튼 클릭 시 호출합니다.

Non-BIM 결과 중 `HIGH_OUT` 또는 `LOW_OUT`이 있으면 F/E는 저장 전에 기안 첨부 팝업을 띄우고, `title`, `attachmentName`을 받은 뒤 저장합니다.

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
    "woId": "VC-2026-ETCH-001",
    "siteNm": "Pyeongtaek",
    "area": "ETCH",
    "areaDetail": "BAY-12"
  },
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
      "calculationTarget": true,
      "conductance": "15.4",
      "judge": "HIGH_OUT",
      "hasModelStandard": true
    }
  ],
  "draft": {
    "visible": false,
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
| `basicInfo.eqId` | string | N | 장비 ID |
| `basicInfo.fabCd` | string | N | FAB 코드 |
| `basicInfo.setModelNm` | string | N | 장비 model |
| `basicInfo.woId` | string | N | WO ID |
| `rows` | array | Y | 저장할 결과 row |
| `rows[].judge` | string | Y | `IN`, `HIGH_OUT`, `LOW_OUT`, `NA` |
| `draft` | object | N | 기안 첨부 정보 |
| `draft.title` | string | 조건부 | Non-BIM Spec Out 저장 시 필수 |
| `draft.attachmentName` | string | 조건부 | Non-BIM Spec Out 저장 시 필수 |
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

## 11. SpecMaster Admin

`V/C Administration > Spec Master` 화면에서 V/C Spec Master와 하위 Detail Spec을 관리합니다.

GoodDocs 원문 API는 조회 목적이 겹치는 항목이 있어, 화면에서는 아래 기준으로 사용합니다. 상세한 B/E 협의용 판단표는 [md/SPEC_MASTER_DEVELOPMENT_GUIDE.md](./md/SPEC_MASTER_DEVELOPMENT_GUIDE.md)를 기준으로 봅니다.

### 화면 진입 콤보

FAB는 SpecMaster API가 아니라 회사 공통코드 API를 원천으로 사용합니다.

```http
GET /api/commcode/comm-code-list?mstCd=VC_FAB_ID&sysId=VC
```

```json
[
  {
    "mstCd": "VC_FAB_ID",
    "sysId": "VC",
    "commonCd": "M16",
    "commonCdKoNm": "M16",
    "commonCdEnNm": "M16",
    "commonCdDesc": "M16A;M16B;M16C",
    "alignSeq": "2",
    "useYn": "Y"
  }
]
```

MODEL, 모델관리기준, 공정, CHAMBER SPEC 후보는 아래 API에서 조회합니다.

```http
GET /api/vc/specmaster/selectfilteroptions
```

```json
{
  "fabIds": ["M14", "M15", "M16"],
  "setModelNms": ["VX-ETCH-300"],
  "specNms": ["M16 ETCH General"],
  "operLargeCatgVals": ["ETCH"],
  "operMidCatgVals": ["Metal Etch"],
  "chambModelNms": ["ETCH-LINE-A"],
  "rows": []
}
```

### Master Grid 조회

좌측 Master Grid는 상위 Spec만 조회합니다. B/E는 `upperCd`가 빈 row만 내려줘야 합니다.

```http
GET /api/vc/specmaster/selectleftpaging?page=0&size=10&fabId=M16&setModelNm=VX-ETCH-300&specNm=ETCH
```

```json
{
  "content": [
    {
      "specId": "SPEC-M16-ETCH-A",
      "specNm": "M16 ETCH General",
      "fabId": "M16",
      "setModelNm": "VX-ETCH-300",
      "detSearYn": "N",
      "upperCd": "",
      "specMinVal": 35,
      "specMaxVal": 72,
      "chgrNm": "K. Lee"
    }
  ],
  "rows": [
    {
      "specId": "SPEC-M16-ETCH-A",
      "specNm": "M16 ETCH General",
      "fabId": "M16",
      "setModelNm": "VX-ETCH-300",
      "detSearYn": "N",
      "upperCd": "",
      "specMinVal": 35,
      "specMaxVal": 72,
      "chgrNm": "K. Lee"
    }
  ],
  "page": 0,
  "size": 10,
  "totalPages": 1,
  "totalElements": 1
}
```

### Detail Grid 조회

우측 Detail Grid는 선택한 Master의 `specId`를 path로 보내 조회합니다. B/E는 `upperCd == specId`인 row만 내려줘야 합니다.

```http
GET /api/vc/specmaster/SPEC-M16-ETCH-A/children
```

```json
[
  {
    "specId": "SPEC-M16-ETCH-A-CH01",
    "specNm": "M16 ETCH Main Chamber",
    "fabId": "M16",
    "setModelNm": "VX-ETCH-300",
    "operLargeCatgVal": "ETCH",
    "operMidCatgVal": "Metal Etch",
    "chambModelNm": "ETCH-LINE-A",
    "upperCd": "SPEC-M16-ETCH-A",
    "specMinVal": 38,
    "specMaxVal": 68,
    "chgrNm": "K. Lee"
  }
]
```

### 저장/수정/삭제

| 동작 | Method | URL | 설명 |
| --- | --- | --- | --- |
| Master 신규 | POST | `/api/vc/specmaster` | `upperCd`를 비워 저장 |
| Detail 신규 | POST | `/api/vc/specmaster/{parentSpecId}/children` | `upperCd`에 parentSpecId 저장 |
| Master/Detail 수정 | PATCH | `/api/vc/specmaster/{specId}` | 같은 table row 수정 |
| Master/Detail 삭제 | DELETE | `/api/vc/specmaster/{specId}?chgchgrempno={empNo}` | 현재 preview는 Master 삭제 시 Detail도 함께 삭제 |

### 주요 Field

| Field | Type | 설명 |
| --- | --- | --- |
| `specId` | string | Spec row PK |
| `specNm` | string | 모델관리기준명 또는 Spec 이름 |
| `fabId` | string | FAB 코드 |
| `setModelNm` | string | 장비 Set Model |
| `operLargeCatgVal` | string | 공정대분류. Detail 팝업에서 사용 |
| `operMidCatgVal` | string | 공정중분류. Detail 팝업에서 사용 |
| `chambModelNm` | string | Chamber Spec. Detail 팝업에서 사용 |
| `detSearYn` | string | 상세스펙 유무 `Y/N` |
| `upperCd` | string | 상위 Master `specId`; 빈 값이면 Master |
| `mgmtTgtYn` | string | 사용여부 `Y/N` |
| `specMinVal` | number | V/C 최소 기준 |
| `specMaxVal` | number | V/C 최대 기준 |
| `chgrEmpno` | string | 담당자 사번 |
| `chgrNm` | string | 담당자 이름 |

## 12. 공통 코드 값

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

## F/E 개발 체크리스트

- Non-BIM FAB는 세션 `user.prjtCd`를 readonly로 표시하고 request `fabCd`에도 넣습니다.
- Calculator FAB는 세션 `user.prjtCd`를 초기 선택값으로만 사용하고 콤보 변경은 유지합니다.
- Calculator FAB를 나중에 잠그려면 `SelectField readOnly`를 `true`로 변경합니다.
- Manual Drawing Results row 선택 key는 `woId`입니다.
- Chamber tab label은 B/E `chamberName`을 유지합니다.
- 계산 결과 저장 후 `nextStatus`로 Manual Drawing Results 상태를 갱신합니다.
- API error는 `message` 또는 `errorMessage`를 우선 표시합니다.
