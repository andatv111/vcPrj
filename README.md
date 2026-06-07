# V/C Simulation Preview

`codex-work` 브랜치에서 작업 중인 V/C Simulation 프론트 미리보기입니다. 회사 B/E와 공통 UI에 붙이기 전에 Non-BIM 수기 도면 기반 계산, 수동 Calculator, 공유 결과 팝업 흐름을 React/Redux/Saga/mock API로 검증합니다.

## 실행

```bash
npm install
npm run dev
npm run build
```

개발 서버는 Vite 기본 포트인 `5173`에서 실행됩니다.

## 화면 구성

| 화면 | 설명 |
| --- | --- |
| BIM/5D Not Applied Fab | EQ/공사번호로 수기 도면을 조회하고, 선택 도면의 Chamber/배관 정보를 수정한 뒤 V/C를 계산합니다. |
| V/C Calculator | 도면 없이 Fab/Model/Model Standard와 Chamber/배관 정보를 직접 입력해 V/C를 계산합니다. |
| Test Data Guide | mock API에서 제공하는 샘플 EQ ID와 테스트 시나리오를 보여줍니다. |
| Vacuum Conductance Result | Non-BIM과 Calculator가 공유하는 계산 결과 팝업입니다. 저장, Spec Out 기안 첨부, 오류 표시를 담당합니다. |

## 최근 동작 기준

### Non-BIM Chamber 추가/삭제

`Manual Drawing Results`에서 도면을 선택하면 도면의 Chamber 수만큼 탭이 생성됩니다.

- 도면에서 온 기본 Chamber는 `locked: true`입니다.
- 기본 Chamber는 저장 여부와 관계없이 삭제할 수 없습니다.
- `Add Chamber`는 도면 선택 후 최대 `MAX_CHAMBER_COUNT`까지 동작합니다.
- 사용자가 추가한 Chamber만 `locked: false`이며, 해당 탭을 선택했을 때만 `Remove`가 활성화됩니다.
- 삭제 후 active Chamber가 사라지면 reducer가 남아 있는 첫 Chamber로 active id를 보정합니다.
- Pipe 영역의 버튼 라벨은 `Add`, `Remove`로 표기합니다.

관련 파일:

| 역할 | 파일 |
| --- | --- |
| 화면 버튼/탭 UI | `src/components/vc/nonBim/Bim5DNotApplied.js` |
| locked Chamber와 사용자 Chamber 생성 | `src/components/vc/nonBim/core/NonBim.helper.js` |
| 삭제 방어 및 active id 보정 | `src/store/vc/nonBim/reducer.js` |

### 결과 저장 후 Non-BIM Calculate 노출 제어

`BIM/5D Not Applied Fab`에서 `최종결과저장` 또는 Spec Out 기안 첨부 후 저장이 오류 없이 성공하면 `Manual Drawing Results`의 현재 선택 row `Status`를 갱신하고, 그 상태값으로 `Calculate` 버튼 노출 여부를 판단합니다.

- 저장 성공 시 Saga가 B/E 응답의 `nextStatus`, `requestStatus`, `status` 중 하나를 읽어 선택 도면의 `requestStatus`로 반영합니다.
- mock 저장 API는 일반 최종 저장이면 `Saved`, 기안 첨부 저장이면 `Draft Attached`를 `nextStatus`로 반환합니다.
- `requestStatus`가 `Saved` 또는 `Draft Attached`이면 Non-BIM `Calculate` 버튼을 숨기고 현재 Status만 표시합니다.
- 수기 도면 조회 API도 같은 `requestStatus`를 내려줘야 저장 직후와 재조회 후 화면 동작이 동일합니다.
- 좌측 `V/C Calculator` 메뉴는 계속 클릭 가능해야 합니다.

관련 파일:

| 역할 | 파일 |
| --- | --- |
| Status 기반 Calculate 노출 제어 | `src/components/vc/nonBim/Bim5DNotApplied.js` |
| 잠금 대상 Status 정의 | `src/components/vc/nonBim/core/NonBim.constant.js` |
| 저장 성공 후 선택 도면 Status 갱신 | `src/saga/vc/nonBim/vcSimSaga.js` |
| Manual Drawing Results 상태 보관 | `src/store/vc/nonBim/reducer.js` |

### Spec Out 기안 첨부

Non-BIM 계산 결과 중 `HIGH_OUT` 또는 `LOW_OUT`이 있으면 최종 저장 전에 표준 기안 첨부가 필요합니다.

- 기안 제목은 텍스트로 입력합니다.
- 첨부는 파일 선택 input으로 받습니다.
- 현재 mock API에는 실제 파일 객체가 아니라 선택 파일명만 저장 payload에 포함합니다.
- 기안 제목과 첨부 파일명이 모두 있어야 `기안 첨부 후 저장` 버튼이 활성화됩니다.
- 공백만 입력한 값은 유효하지 않은 것으로 처리합니다.
- 저장 실패 시 팝업을 유지하고 오류를 표시합니다.

관련 파일:

| 역할 | 파일 |
| --- | --- |
| 결과/기안 첨부 팝업 UI | `src/components/vc/nonBim/popup/VcResultPopup.js` |
| 저장 전 필수 조건 판단 | `src/store/vc/vcResult/reducer.js` |
| 저장 API 진입 방어 | `src/saga/vc/nonBim/vcSimSaga.js` |

### 저장 성공/실패

- 저장 성공 시 `Vacuum Conductance Result` 팝업과 기안 첨부 팝업이 자동으로 닫힙니다.
- 저장 성공 후 팝업 안에 `저장 완료: VC-SAVE-...`를 남기지 않습니다.
- 저장 중에는 버튼이 `Saving...`으로 바뀌고 중복 클릭을 막습니다.
- 저장 실패 시 팝업은 닫히지 않고 오류 메시지를 보여줍니다.

## 주요 파일

| 목적 | 파일 |
| --- | --- |
| 앱 shell, 좌측 메뉴, 테스트 데이터 안내 | `src/main.js` |
| Non-BIM 수기 도면 화면 | `src/components/vc/nonBim/Bim5DNotApplied.js` |
| 수동 V/C Calculator | `src/components/vc/nonBim/VcCalculator.js` |
| 결과 팝업/기안 첨부 팝업 | `src/components/vc/nonBim/popup/VcResultPopup.js` |
| Chamber/Pipe/결과 정규화 helper | `src/components/vc/nonBim/core/NonBim.helper.js` |
| 컬럼, pipe type, 판정 코드 상수 | `src/components/vc/nonBim/core/NonBim.constant.js` |
| Non-BIM Redux | `src/store/vc/nonBim/*` |
| Calculator Redux | `src/store/vc/vcCalculator/*` |
| 공유 결과 팝업 Redux | `src/store/vc/vcResult/*` |
| Saga 흐름 | `src/saga/vc/nonBim/vcSimSaga.js` |
| mock API와 B/E 교체 지점 | `src/service/api/vc/sim/vcSimApi.js` |
| B/E API 전환 예시 | `src/service/api/vc/sim/vcSimBEApi.js` |

## 흐름 요약

### 도면 조회

1. 화면에서 EQ ID 또는 공사번호를 입력합니다.
2. `FETCH_MANUAL_DRAWINGS_REQUEST`를 dispatch합니다.
3. Saga가 `vcSimApi.searchManualDrawings(search)`를 호출합니다.
4. `normalizeDrawingList`가 응답을 화면 row로 변환합니다.
5. reducer가 `drawings`에 저장합니다.

### 도면 선택

1. 도면 radio를 선택하면 `SELECT_DRAWING`을 dispatch합니다.
2. reducer가 선택 도면과 Chamber 탭을 생성합니다.
3. 도면 기본 Chamber는 locked 상태로 생성됩니다.
4. Saga가 `getEquipmentSpecOptions`를 호출해 Model Standard 옵션을 보강합니다.

### 계산

1. `CALCULATE_REQUEST`를 dispatch합니다.
2. Saga가 필수 pipe 값을 검증합니다.
3. helper가 B/E 요청 payload를 만듭니다.
4. mock API가 conductance와 judge를 반환합니다.
5. `normalizeCalculationResult`가 공유 결과 팝업 모델로 변환합니다.
6. `vcResultActions.openResultPopup(result)`로 결과 팝업을 엽니다.

### 저장

1. 결과 팝업에서 `SAVE_RESULT_REQUEST`를 dispatch합니다.
2. reducer가 Non-BIM Spec Out과 기안 첨부 누락 여부를 먼저 판단합니다.
3. 기안 첨부가 필요하면 중첩 팝업을 열고 저장 loading을 시작하지 않습니다.
4. 기안 제목과 파일이 모두 있으면 Saga가 `saveVcResult`를 호출합니다.
5. Non-BIM 저장 성공이면 저장 응답의 `nextStatus`/`requestStatus`/`status`를 선택 도면 `requestStatus`에 반영합니다.
6. 성공 시 `SAVE_RESULT_SUCCESS`로 팝업을 닫고, 실패 시 `SAVE_RESULT_FAILURE`로 오류를 표시합니다.

## B/E 전환 원칙

실제 회사 API에 붙일 때는 화면 컴포넌트보다 `vcSimApi.js`와 `NonBim.helper.js`를 먼저 수정합니다.

| 교체 대상 | 원칙 |
| --- | --- |
| URL, HTTP method, query/body | `vcSimApi.js`에서 흡수 |
| B/E 응답 필드명 차이 | `NonBim.helper.js`의 normalize 함수에서 흡수 |
| 공통코드/MDM option 구조 | `{ value, label, minSpec?, maxSpec?, raw? }` 형태로 변환 |
| 결과 저장 DTO | `saveVcResult` 내부에서 회사 저장 API 계약에 맞게 변환 |
| 저장 후 도면 상태 | 저장 응답의 `nextStatus` 또는 `requestStatus`를 `Manual Drawing Results.requestStatus`로 반영 |
| 파일 업로드 | 현재는 파일명만 저장하므로 실제 연동 시 업로드 ID 또는 multipart 전송으로 확장 |

### 파일 첨부 전환 방식

현재 preview는 파일명을 `draft.attachmentName`에 저장합니다. 실제 연동에서는 다음 중 하나를 선택하는 것이 좋습니다.

| 방식 | 설명 |
| --- | --- |
| 선 업로드 | 파일 업로드 API가 `attachmentId`를 반환하고 저장 API에는 `attachmentId`만 전달 |
| multipart 저장 | 결과 저장 API를 `multipart/form-data`로 바꾸고 JSON blob과 file을 함께 전달 |

## API 초안

### 수기 도면 조회

```http
GET /api/vc/sim/non-bim/manual-drawings?eqId=EQ-VAC&constructionNo=VC-2026
```

```json
{
  "list": [
    {
      "drawingId": "DWG-ETCH-001",
      "constructionNo": "VC-2026-ETCH-001",
      "eqId": "EQ-VAC-ETCH-1001",
      "fab": "P3",
      "model": "VX-ETCH-300",
      "requestStatus": "Ready",
      "chamberCount": 3,
      "chambers": [],
      "foreline": {
        "fileId": "FILE-001",
        "fileName": "foreline.pdf"
      }
    }
  ]
}
```

### Model Standard 조회

```http
GET /api/vc/sim/non-bim/equipment-spec-options?drawingId=DWG-ETCH-001&eqId=EQ-VAC-ETCH-1001
```

```json
{
  "list": [
    {
      "value": "ETCH-LINE-A",
      "label": "ETCH-LINE-A / General",
      "minSpec": "35",
      "maxSpec": "72"
    }
  ]
}
```

### 계산

```http
POST /api/vc/sim/non-bim/calculate
POST /api/vc/sim/calculator/calculate
```

요청은 `sourceType`, `equipment`, `chambers`, `pipeList`를 포함합니다. 응답은 결과 팝업 row로 변환 가능한 `rows` 배열을 반환해야 합니다.

### 저장

```http
POST /api/vc/sim/result/save
```

Spec Out이 있는 Non-BIM 결과는 기안 첨부 정보가 필요합니다.

```json
{
  "sourceType": "NON_BIM",
  "basicInfo": {
    "eqId": "EQ-VAC-ETCH-1001",
    "fab": "P3",
    "model": "ETCH-LINE-A"
  },
  "rows": [],
  "draft": {
    "title": "Spec Out 표준 기안",
    "attachmentName": "standard_draft.pdf",
    "comment": "검토 요청"
  }
}
```

권장 응답:

```json
{
  "savedId": "VC-SAVE-001",
  "sourceType": "NON_BIM",
  "savedAt": "2026-06-07T00:00:00.000Z",
  "rowCount": 3,
  "draftAttached": true,
  "nextStatus": "Draft Attached"
}
```

`nextStatus`는 저장 직후 `Manual Drawing Results`의 `Status`에 반영할 값입니다. 일반 최종 저장은 `Saved`, 표준 기안 첨부 저장은 `Draft Attached`처럼 업무 상태를 명확히 내려주세요.

## 검증 체크리스트

1. `npm run build`
2. Non-BIM 도면 검색
3. 도면 선택 후 원본 Chamber 탭의 `Remove` 비활성 확인
4. `Add Chamber` 후 새 탭의 `Remove` 활성 확인
5. Pipe 버튼 라벨이 `Add`, `Remove`인지 확인
6. Spec Out 결과 저장 시 기안 첨부 팝업 확인
7. 파일 선택 전 저장 버튼 비활성 확인
8. 파일 선택 후 저장 성공 시 팝업 자동 종료 확인
9. Non-BIM 저장 성공 후 선택 도면 `Status`가 `Saved` 또는 `Draft Attached`로 바뀌고 `Calculate` 버튼이 숨겨지는지 확인
10. Non-BIM 저장 성공 후 좌측 `V/C Calculator` 메뉴는 계속 클릭 가능한지 확인

## 남은 개선 후보

- 실제 파일 업로드 방식 결정 후 `File` 객체 또는 `attachmentId`를 저장 payload에 포함해야 합니다.
- 저장 성공 후 Non-BIM `Calculate` 버튼을 다시 보여줘야 하는 업무 조건이 생기면 B/E 상태 코드와 `CALCULATION_LOCKED_DRAWING_STATUSES` 매핑을 함께 조정해야 합니다.
- `dist` 산출물은 빌드 때마다 해시가 바뀌므로 배포 정책에 따라 commit 포함 여부를 정해야 합니다.
- 회사 공통 Grid/Combo 컴포넌트 전환 시 현재 HTML table/select를 wrapper로 교체하면 됩니다.
