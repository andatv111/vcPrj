# V/C Simulation F/E -> B/E 공식 API 요청서

## 1. 문서 목적

이 문서는 V/C Simulation F/E와 B/E가 함께 사용하는 공식 API 계약입니다. B/E는 아래 endpoint, 필수값, 응답 필드와 업무 규칙을 기준으로 Controller/DTO를 구현하고 F/E는 동일한 필드명으로 연동합니다.

각 API는 request sample, response sample, 빈 값 정책, 오류 message 정책을 함께 확정합니다. 저장 응답의 `nextStatus`를 도면 재조회 상태로 사용할 경우 `/manual-drawings`의 `requestStatus`와 값과 의미를 동일하게 정의해야 합니다.

## 2. 공통 환경

| 항목 | 요청 내용 |
| --- | --- |
| 로컬 B/E URL | `http://localhost:8090` |
| F/E 호출 방식 | `/api/...` 상대 경로. Vite가 B/E `8090`으로 proxy |
| 기본 Content-Type | JSON API는 `application/json` |
| 파일 다운로드 | 파일 body와 `Content-Disposition` 파일명 반환 |
| 문자 인코딩 | UTF-8 |
| 날짜/시간 | ISO-8601 문자열 권장 |

F/E 시작 전에 Eclipse/STS의 B/E가 8090으로 완전히 기동되어야 합니다. B/E가 꺼져 있거나 재시작 중이면 Vite proxy에 `ECONNREFUSED`가 기록되며, F/E 화면에는 B/E 8090 실행 여부를 확인하라는 오류가 표시됩니다.

## 3. 공통 응답/오류 요청

현재 API는 조회 endpoint에서 배열 또는 객체를 직접 반환하고, 계산 및 저장 endpoint에서 `{ success, data }` 구조를 사용합니다. F/E는 `{ result }`, `{ list }` 같은 임의 wrapper를 허용하지 않으므로 endpoint별 응답 구조를 아래 계약과 동일하게 유지합니다.

```json
{
  "success": true,
  "data": {},
  "message": "",
  "errorCode": null
}
```

오류 예시:

```json
{
  "success": false,
  "data": null,
  "message": "해당 공사번호의 도면을 찾을 수 없습니다.",
  "errorCode": "VC_DRAWING_NOT_FOUND"
}
```

| 규칙 | 요청 내용 |
| --- | --- |
| HTTP Status | 오류 유형에 맞는 4xx/5xx 사용 |
| message | F/E가 사용자에게 노출할 수 있는 한국어 문장 |
| 빈 목록 | `[]` 반환 |
| 빈 문자열 | `""` 또는 팀 표준에 맞춘 `null`, 단 API별 일관성 유지 |
| 필드 누락 | 화면 필수 필드는 임의로 생략하지 않음 |

### 3.1 DTO 필드명 원칙

- JSON 필드명은 현재 Java DTO/record의 camelCase 이름을 그대로 사용합니다.
- `chamberId`와 `chId`, `chamberName`과 `chambNm`처럼 동일 의미의 alias를 복수로 제공하지 않습니다.
- DTO 이름 변경이 필요하면 Java DTO, F/E 모델, 이 문서의 sample을 같은 작업 단위로 변경합니다.
- 조회 DTO와 계산 DTO가 실제로 다른 경우에만 명시적으로 변환합니다. 현재 대표 사례는 조회 Chamber의 `pipeRows`를 계산 요청 Chamber의 `pipeList`로 변환하는 부분입니다.

| API 유형 | 현재 응답 형태 |
| --- | --- |
| options, equipments, manual-drawings, chambers, equipment-spec-options | 배열 또는 객체 직접 응답 |
| calculate, result/save | `{ "success": true, "data": ... }` |

## 4. 전체 API 목록

| 화면/기능 | Method | URL | 필수 요청 | 응답 핵심 |
| --- | --- | --- | --- | --- |
| Non-BIM 화면 옵션 | GET | `/api/vc/sim/non-bim/options` | 없음 | FAB, Pipe Type 콤보 |
| EQ 자동완성 | GET | `/api/vc/sim/non-bim/equipments` | `keyword` | EQ 후보 목록 |
| 수기 도면 조회 | GET | `/api/vc/sim/non-bim/manual-drawings` | `eqId` | 도면 목록, `constructionNo` 필수 |
| 선택 도면 Chamber 조회 | GET | `/api/vc/sim/non-bim/chambers` | `eqId`, `constructionNo` | 실제 Chamber명과 탭 상세 |
| 장비 Spec 조회 | GET | `/api/vc/sim/non-bim/equipment-spec-options` | 장비 식별 조건 | Model Standard, Min/Max |
| Foreline 다운로드 | GET | `/api/vc/sim/non-bim/foreline-drawing/download` | `eqId`, `constructionNo` | 파일 body |
| Non-BIM 계산 | POST | `/api/vc/sim/non-bim/calculate` | equipment, chambers | 결과 rows |
| Calculator 옵션 | GET | `/api/vc/sim/calculator/options` | 없음 | FAB/MODEL/Spec 옵션 |
| Calculator 계산 | POST | `/api/vc/sim/calculator/calculate` | equipment, chambers | 결과 rows |
| 결과 저장 | POST | `/api/vc/sim/result/save` | sourceType, basicInfo, rows | 저장 결과 |

## 4.1 화면 데이터 연동 원칙

조회조건, 콤보, 그리드처럼 업무 데이터가 필요한 UI는 F/E에 목록을 하드코딩하지 않고 B/E API에서 조회합니다. 단, 화면의 배치와 콤보 위치, 그리드 컬럼 순서는 퍼블리싱/F/E 영역이므로 API 연동 작업에서 임의로 이동하지 않습니다.

| UI 항목 | 데이터 원천/API | F/E 개발 책임 | B/E 개발 책임 |
| --- | --- | --- | --- |
| Non-BIM 조회조건 FAB 콤보 | `GET /non-bim/options`의 `fabs` | 현재 위치의 select에 options 주입 | 사용 가능한 FAB 코드/표시명 반환 |
| Non-BIM 조회조건 EQ ID | `GET /non-bim/equipments` | 입력/자동완성과 선택값 관리 | keyword 기준 장비 후보 조회 |
| Non-BIM 조회조건 공사번호 | 사용자 입력 후 `/manual-drawings` query | 입력값과 검색 validation 관리 | fab/eqId/constructionNo 조건 조회 |
| Manual Drawing Results 그리드 | `GET /non-bim/manual-drawings` | 기존 컬럼 위치에 row 렌더링, radio 이벤트 연결 | 도면 row와 상태/Foreline/Chamber 데이터 반환 |
| 선택 도면 Chamber 탭 | `GET /non-bim/chambers` | 기존 탭은 응답 `chamberName` 유지, Add 탭만 `CHAMBER{순번}` 사용 | `eqId`+`constructionNo` 기준 실제 Chamber 상세 반환 |
| Model Standard 콤보 | `GET /non-bim/equipment-spec-options` | 선택된 Chamber 콤보에 options 주입 | 장비/FAB/모델/공사번호 기준 Spec 조회 |
| Min/Max Spec | Model Standard 응답 | read-only 표시 | 선택 option에 minSpec/maxSpec 포함 |
| Pipe 유형 콤보 | 화면 options API의 `pipeTypes` | 기존 Pipe Grid 유형 컬럼에 options 주입 | PIPE/ELBOW/REDUCER 코드와 표시명 반환 |
| Calculator FAB/MODEL 콤보 | `GET /calculator/options` | 기존 조회조건 위치에 options 주입 | FAB/MODEL 목록 반환 |
| Calculator Model Standard | `/calculator/options`의 `modelStandards` | Chamber Spec 콤보에 options 주입 | value/label/minSpec/maxSpec 반환 |
| 계산 결과 그리드 | POST calculate 응답의 `rows` | 결과 팝업 기존 컬럼에 row 렌더링 | conductance/judge 포함 결과 반환 |

### F/E에서 하드코딩하지 않는 데이터

- FAB 목록
- MODEL 목록
- Model Standard와 Min/Max Spec
- Pipe Type 표시 옵션
- EQ ID 후보
- 수기 도면 그리드 row
- Foreline 파일 정보
- 계산 결과와 판정
- 저장 결과와 다음 상태

### F/E에 유지하는 UI/업무 정책

- 화면, 조회조건, 콤보, 버튼, 그리드의 배치와 순서
- 그리드 컬럼 제목과 단위
- Pipe Type별 입력 가능 필드 및 필수값 검증
- Redux 상태와 사용자 이벤트 연결
- Java DTO와 동일한 camelCase 필드 유지 및 조회 DTO와 계산 DTO 사이의 명시적 변환

## 4.2 Non-BIM 화면 옵션

`GET /api/vc/sim/non-bim/options`

응답 예시:

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

B/E는 실제 사용 가능 코드만 반환해 주세요. 정렬 순서가 업무적으로 필요하면 `sortOrder`를 추가하고 B/E에서 정렬된 결과를 반환하는 방식을 권장합니다.

## 5. BIM/5D 미적용 Fab

### 5.1 EQ ID 자동완성

`GET /api/vc/sim/non-bim/equipments?keyword=EQ-VAC`

| Query | 필수 | 설명 |
| --- | --- | --- |
| `keyword` | 조건부 | 사용자가 입력한 EQ ID 검색어 |

응답 예시:

```json
[
  {
    "eqId": "EQ-VAC-ETCH-1001",
    "constructionNo": "VC-2026-ETCH-001",
    "label": "EQ-VAC-ETCH-1001 (M16 / ETCH)"
  }
]
```

### 5.2 수기 도면 조회

`GET /api/vc/sim/non-bim/manual-drawings?fab=M16&eqId=EQ-VAC-ETCH-1001&constructionNo=VC-2026-ETCH-001`

| Query | 필수 | 설명 |
| --- | --- | --- |
| `fab` | 선택 | FAB 조건 |
| `eqId` | 필수 | 장비 ID |
| `constructionNo` | 선택 | 공사번호 |

응답 row 필수/권장 필드:

| 필드 | 중요도 | 설명 |
| --- | --- | --- |
| `constructionNo` | 필수 | 첫 번째 그리드 업무 PK |
| `eqId` | 필수 | 장비 ID |
| `site`, `fab`, `area1`, `area2` | 필수 | 화면 기본 정보 |
| `changeType`, `equipmentType` | 필수 | 변경/장비 구분 |
| `requestStatus` | 필수 | Calculate 가능 여부 판단 상태 |
| `model` | 권장 | 결과 팝업과 계산 기본 정보 |
| `chamberCount` | 필수 | Chamber 탭 수 |
| `chambers` | 권장 | 장비에 매핑된 Chamber 상세 |
| `foreline` | 권장 | categoryName, registeredAt, registeredBy, fileId, fileName |

### 5.2.1 선택 도면 Chamber 조회

`GET /api/vc/sim/non-bim/chambers?eqId=EQ-VAC-ETCH-1001&constructionNo=VC-2026-ETCH-001`

| 항목 | 계약 |
| --- | --- |
| 호출 시점 | Manual Drawing Results radio/row 선택 직후 |
| 필수 Query | `eqId`, `constructionNo` |
| 현재 개발 원천 | B/E `data/VC_PORTAL_MANUAL_DRAWING.txt`의 선택 도면 `chambers[]` |
| 탭 표시 필드 | `chambers[].chamberName` |
| 기존 조회 탭 | B/E의 `chamberName`을 변경하지 않고 표시 |
| 사용자 Add 탭 | 현재 탭 위치에 따라 `CHAMBER4`처럼 F/E가 임시명 생성 |
| 사용하면 안 되는 원천 | `M16_VC_REQ_CHAMBER.txt`의 `chambNmIndexVal`은 계산 요청/결과 저장값이므로 초기 탭명 조회에 사용하지 않음 |
| 운영 전환 | 설계포탈의 EQ/공사번호별 Chamber 매핑 테이블을 조회해 동일 DTO로 반환 |

응답의 각 항목은 최소 `chamberId`, `chamberName`을 포함하고, 계산 화면 구성을 위해 `modelStandard`, `minSpec`, `maxSpec`, `processLarge`, `processMiddle`, `pipeRows`를 함께 반환합니다.

`pipeRows` 항목은 현재 `PortalManualDrawing.PipeRow` 필드명을 사용합니다.

| 필드 | 설명 |
| --- | --- |
| `pipeType` | `PIPE`, `ELBOW`, `REDUCER` |
| `inletDia` | 조회 도면의 입구 내경 |
| `pipeLength` | 조회 도면의 배관 길이 |
| `angle` | Elbow 각도 |
| `outletDia` | Reducer 출구 내경 |
| `qty` | 수량 |

F/E는 이 조회 모델을 계산 요청 시 `pipeList[].type`, `inletDiameter`, `length`, `angle`, `outletDiameter`, `quantity`로 명시적으로 변환합니다.

### 5.3 장비 Model Standard/Spec 조회

`GET /api/vc/sim/non-bim/equipment-spec-options`

| Query | 필수 | 설명 |
| --- | --- | --- |
| `eqId` | 권장 | Chamber/Spec을 조회할 장비 기준 키 |
| `fab` | 선택 | FAB 필터 |
| `model` | 선택 | 장비 모델 |
| `constructionNo` | 선택 | 공사번호 보조 조건 |

응답 예시:

```json
[
  {
    "value": "STD-ETCH-A",
    "label": "STD-ETCH-A",
    "minSpec": "10",
    "maxSpec": "20"
  }
]
```

적용 가능한 기준이 없으면 빈 배열을 반환해 주세요. F/E는 해당 Chamber의 산출대상을 off 처리합니다.

### 5.4 Foreline 도면 다운로드

`GET /api/vc/sim/non-bim/foreline-drawing/download`

| Query | 필수 | 설명 |
| --- | --- | --- |
| `eqId` | 필수 | 장비 ID |
| `constructionNo` | 필수 | 공사번호 |
| `drawingKey` | 선택 | 다운로드 보조 키 |
| `fileId` | 선택 | 파일 저장소 보조 키 |
| `fab` | 선택 | 추가 조회 조건 |

B/E는 파일 body와 `Content-Disposition: attachment; filename=...`을 반환해 주세요. 이후 revision/lineId가 추가되더라도 `eqId + constructionNo` 업무 키는 유지하고 보조 query를 확장합니다.

## 6. 계산 API

Non-BIM과 Calculator는 같은 요청/결과 모델을 사용합니다.

요청 예시:

```json
{
  "sourceType": "NON_BIM",
  "constructionNo": "VC-2026-ETCH-001",
  "search": {
    "fab": "M16",
    "eqId": "EQ-VAC-ETCH-1001",
    "constructionNo": "VC-2026-ETCH-001"
  },
  "equipment": {
    "eqId": "EQ-VAC-ETCH-1001",
    "constructionNo": "VC-2026-ETCH-001",
    "site": "Pyeongtaek",
    "fab": "M16",
    "area1": "ETCH",
    "area2": "BAY-12",
    "model": "MODEL-A"
  },
  "chambers": [
    {
      "seq": 1,
      "chamberId": "CH-01",
      "chamberName": "Ch01 Main Process",
      "calculationTarget": true,
      "modelStandard": "STD-ETCH-A",
      "minSpec": "10",
      "maxSpec": "20",
      "isSpecSkipped": false,
      "processLarge": "ETCH",
      "processMiddle": "Metal Etch",
      "pipeList": [
        {
          "seq": 1,
          "type": "PIPE",
          "inletDiameter": "4",
          "length": "1000",
          "angle": "0",
          "outletDiameter": "4",
          "quantity": "1"
        }
      ]
    }
  ]
}
```

계산 응답 예시:

```json
{
  "success": true,
  "data": {
    "eqId": "EQ-VAC-ETCH-1001",
    "fab": "M16",
    "model": "MODEL-A",
    "guid": "VC-GUID-001",
    "rows": [
      {
        "id": "RESULT-CH-01",
        "chamberId": "CH-01",
        "chamberName": "Ch01 Main Process",
        "confirmFlag": "N",
        "processLarge": "ETCH",
        "processMiddle": "Metal Etch",
        "modelStandard": "STD-ETCH-A",
        "minSpec": "10",
        "maxSpec": "20",
        "conductance": "15.4",
        "judge": "IN"
      }
    ]
  }
}
```

결과 row 요청 필드:

| 필드 | 설명 |
| --- | --- |
| `chamberId`, `chamberName` | Chamber 식별/표시값 |
| `processLarge`, `processMiddle` | 공정 정보 |
| `modelStandard`, `minSpec`, `maxSpec` | 적용 Spec |
| `conductance` | 계산값 또는 `N/A` |
| `judge` | `IN`, `HIGH_OUT`, `LOW_OUT`, `NA` |

| 조건 | 반환 요청 |
| --- | --- |
| Spec 범위 내 | `judge: "IN"` |
| 상한 초과 | `judge: "HIGH_OUT"` |
| 하한 미달 | `judge: "LOW_OUT"` |
| 산출 제외/Spec 없음 | `conductance: "N/A"`, `judge: "NA"` |

## 7. Calculator 옵션

`GET /api/vc/sim/calculator/options`

응답 예시:

```json
{
  "fabs": [{ "value": "M16", "label": "M16" }],
  "models": [{ "value": "MODEL-A", "label": "MODEL-A" }],
  "modelStandards": [
    { "value": "STD-ETCH-A", "label": "STD-ETCH-A", "minSpec": "10", "maxSpec": "20" }
  ],
  "pipeTypes": [
    { "value": "PIPE", "label": "Pipe" },
    { "value": "ELBOW", "label": "Elbow" },
    { "value": "REDUCER", "label": "Reducer" }
  ]
}
```

## 8. 결과 저장

`POST /api/vc/sim/result/save`

```json
{
  "sourceType": "NON_BIM",
  "basicInfo": {
    "fab": "M16",
    "model": "MODEL-A",
    "eqId": "EQ-VAC-ETCH-1001",
    "constructionNo": "VC-2026-ETCH-001"
  },
  "rows": [],
  "draft": {
    "title": "V/C Spec Out 검토 요청",
    "comment": "Spec Out 결과 확인 요청",
    "attachmentName": "review.pdf"
  }
}
```

현재 응답 계약:

```json
{
  "success": true,
  "data": {
    "savedId": "VC-SAVE-001",
    "sourceType": "NON_BIM",
    "savedAt": "2026-06-14T05:00:00Z",
    "rowCount": 2,
    "draftAttached": true,
    "nextStatus": "Draft Attached"
  }
}
```

실제 첨부 방식은 다음 중 하나를 B/E와 확정해야 합니다.

1. 파일 업로드 API 호출 후 `attachmentId`를 저장 API에 전달
2. 저장 API를 `multipart/form-data`로 변경해 JSON과 파일을 함께 전달

## 9. 변경 관리 요청

- endpoint 또는 DTO 변경 전에 F/E와 sample request/response를 먼저 공유해 주세요.
- 확정된 Java DTO 필드명만 사용하며 F/E helper에서 과거 이름을 alias로 추가하지 않습니다.
- `constructionNo`, `judge`, `requestStatus` 같은 업무 의미가 있는 값은 코드 정의를 함께 전달해 주세요.
- 변경 시 Java Controller/DTO, F/E `vcSimApi.js`, 이 문서를 같은 작업 단위로 갱신합니다.
- B/E 오류 message는 사용자가 이해할 수 있는 문장으로 작성해 주세요.
