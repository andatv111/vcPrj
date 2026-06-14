# V/C Simulation F/E

React 18, Redux, Redux-Saga, Vite 기반 V/C Simulation 화면 프로젝트입니다. 별도 Eclipse/STS에서 실행하는 Spring Boot B/E와 HTTP API로 통신합니다.

## 실행 환경

| 구분 | 값 |
| --- | --- |
| F/E 개발 서버 | `http://localhost:5173` |
| B/E 서버 | `http://localhost:8090` |
| API 호출 경로 | F/E는 `/api/...` 상대 경로 사용 |
| 개발 Proxy | Vite가 `/api`를 `http://localhost:8090`으로 전달 |

Vite는 `strictPort: true`로 설정되어 있습니다. 이미 5173이 사용 중이면 5174로 자동 이동하지 않고 실행을 중단합니다. 기존 F/E 터미널을 사용하거나 5173 프로세스를 종료한 후 다시 실행하세요.

```powershell
npm install
npm run dev
```

운영 빌드 확인:

```powershell
npm run build
npm run test:vc
```

`test:vc`는 Non-BIM fixture의 산출대상/Spec 유지, Calculator의 FAB+Model별 Model Standard 선택, 전체 산출대상 해제 검증을 Vite 모듈 환경에서 확인합니다.

## 주요 구조

| 경로 | 역할 |
| --- | --- |
| `src/main.js` | React root, Redux Provider, 앱 메뉴와 화면 전환 |
| `src/components/vc/nonBim/Bim5DNotApplied.js` | BIM/5D 미적용 Fab 화면 업무 연결 |
| `src/components/vc/nonBim/VcCalculator.js` | V/C Calculator 화면 업무 연결 |
| `src/components/vc/nonBim/ui` | 퍼블리셔가 교체하기 쉬운 JSX 그리드/폼 컴포넌트 |
| `src/components/vc/nonBim/popup` | 결과 및 표준 기안 첨부 팝업 |
| `src/store/vc` | Redux action/reducer/selector. 화면과 saga가 root state 경로를 직접 참조하지 않도록 기능별 selector 제공 |
| `src/saga/vc/nonBim/vcSimSaga.js` | 화면 비동기 흐름과 API 호출 조정 |
| `src/service/api/vc/sim/vcSimApi.js` | V/C B/E 호출의 유일한 HTTP adapter |
| `src/components/vc/nonBim/core/NonBim.helper.js` | Chamber/Pipe 공통 규칙, 입력 검증, 요청 DTO 생성, 결과 변환 |
| `README_API.md` | B/E 개발팀 전달용 공식 API 요청 문서 |

## 스타일 관리 규칙

`src/main.js`의 전역 CSS import는 주석 처리했습니다.

```js
// import "./styles.css";
```

현재 공통 스타일은 실제 업무 화면인 `Bim5DNotApplied.js`, `VcCalculator.js`에서 import합니다. 퍼블리셔 산출물이 들어오면 다음 기준으로 점진 분리합니다.

| 퍼블리셔 산출물 | 적용 위치 |
| --- | --- |
| 상단 도면 결과 그리드 | `ui/DrawingResultTable.js`와 같은 위치의 CSS |
| Chamber 탭/Spec/Pipe Grid | `ui/ChamberWorkspace.js`와 같은 위치의 CSS |
| 검색조건/화면 레이아웃 | 각 화면 파일과 같은 위치의 CSS |
| 결과/기안 팝업 | 각 popup 파일과 같은 위치의 CSS |

업무 화면은 Redux와 이벤트 props를 연결하고, 퍼블리셔 마크업은 `ui` 컴포넌트가 담당합니다. 퍼블리셔 소스를 적용할 때 `data`, `loading`, `onChange`, `onClick` props 계약을 유지하면 업무 로직 수정 범위를 줄일 수 있습니다.

## API 관리 규칙

- 화면과 Saga는 `vcSimApi.js`만 사용합니다.
- endpoint, HTTP method, query/body 조립, 공통 오류 처리는 `vcSimApi.js`에서 관리합니다.
- F/E 필드명은 현재 Java DTO의 camelCase 이름을 기준으로 사용합니다. `chId`, `chambNm`처럼 여러 alias를 동시에 허용하지 않습니다.
- `NonBim.helper.js`는 임의의 필드명을 살려주는 호환 계층이 아닙니다. 조회 DTO의 `pipeRows`를 계산 DTO의 `pipeList`로 바꾸는 명시적 변환, 공통 입력 규칙, 검증, 계산 요청/결과 처리를 담당합니다.
- `vcSimBEApi.js`는 사용하지 않으며 삭제했습니다.
- API 계약 변경 시 `vcSimApi.js`, Java Controller/DTO, `README_API.md`를 함께 수정합니다.
- 콤보 option, 조회 결과, 그리드 row 등 업무 데이터는 F/E 상수로 만들지 않고 B/E API에서 조회합니다.
- API 연동을 이유로 조회조건/콤보/그리드 위치를 임의 변경하지 않습니다. 화면 배치는 퍼블리싱/F/E 책임입니다.

## Redux selector 사용 원칙

- 컴포넌트와 saga는 `state.vc.nonBim` 같은 root state 경로를 직접 읽지 않고 기능별 selector를 사용합니다.
- selector는 root reducer 접근, 활성 Chamber fallback, Spec Out/N/A 여부처럼 여러 사용처가 공유하는 상태 계산을 담당합니다.
- 현재 파일명은 `vcSimSelector.js`이지만 회사 표준에 맞춰 변경할 경우 `nonBimSelector.js`, `vcCalculatorSelector.js`, `vcResultSelector.js`처럼 기능명이 드러나는 이름을 권장합니다.
- selector를 제거해 동일한 접근 로직을 컴포넌트와 saga에 중복 작성하지 않습니다.

## 유지보수 주석 원칙

- 화면 컴포넌트에는 컴포넌트 역할과 상태 관리 주체를 설명합니다.
- `useEffect`에는 실행 시점과 조회 목적을, `dispatch` 주변에는 reducer 또는 saga가 수행하는 후속 업무를 간결하게 설명합니다.
- 코드 한 줄을 그대로 번역하는 주석보다 업무 규칙, 상태 변경 이유, API 흐름처럼 코드만으로 파악하기 어려운 내용을 우선합니다.

현재 API 데이터 대상:

| 화면 데이터 | API |
| --- | --- |
| Non-BIM FAB/Pipe Type | `GET /api/vc/sim/non-bim/options` |
| EQ ID 후보 | `GET /api/vc/sim/non-bim/equipments` |
| 수기 도면 그리드 | `GET /api/vc/sim/non-bim/manual-drawings` |
| Model Standard/Spec | `GET /api/vc/sim/non-bim/equipment-spec-options` |
| Calculator FAB/MODEL/Spec/Pipe Type | `GET /api/vc/sim/calculator/options` |

## 핵심 업무 키

- BIM/5D 미적용 Fab 조회조건은 `fab(optional)`, `eqId(required)`, `constructionNo(optional)`입니다.
- 첫 번째 그리드의 업무 PK는 `constructionNo`입니다.
- F/E의 `drawing.id`는 React row 렌더링을 위해 `eqId + constructionNo`로 생성하는 화면 전용 key이며 B/E DTO나 DB 컬럼이 아닙니다.
- B/E 수기 도면 DTO와 DB 조회는 `DRAWING_ID`를 요구하지 않습니다. 상세 조회 안정키는 `eqId + constructionNo`입니다.
- Foreline 다운로드는 `eqId + constructionNo`를 필수로 사용합니다.
- `drawingKey`, `fileId`는 다운로드용 보조 식별자입니다.
- radio 선택 후 Chamber/Spec 조회는 `eqId + constructionNo`로 선택 도면을 특정하여 호출합니다.
- 상세 Chamber에 정상 Model Standard와 Min/Max가 있으면 후속 옵션 목록이 일부 부족해도 산출대상을 임의 해제하지 않습니다.
- V/C Calculator의 Model Standard는 선택한 `fab + model` 조합에 해당하는 항목만 표시합니다.
- 모든 Chamber의 산출대상이 해제된 경우 계산 API를 호출하지 않고 입력 안내를 표시합니다.

## 결과 규칙

| judge | 의미 | F/E 처리 |
| --- | --- | --- |
| `IN` | Spec 범위 내 | 정상 표시 |
| `HIGH_OUT` | 상한 초과 | Spec Out 표시 |
| `LOW_OUT` | 하한 미달 | Spec Out 표시 |
| `NA` | 산출 제외 또는 Spec 미적용 | Conductance `N/A` 표시 |

Spec Out이 포함된 Non-BIM 결과 저장은 표준 기안 첨부 정보가 필요합니다. 실제 파일 연동 시 별도 업로드 후 `attachmentId` 전달 방식 또는 multipart 저장 방식 중 하나를 B/E와 확정해야 합니다.

## 로컬 연동 순서

1. Eclipse/STS에서 `vcBePrj`를 Spring Boot App으로 실행합니다.
2. B/E가 `http://localhost:8090`에서 실행되는지 확인합니다.
3. F/E 루트에서 `npm run dev`를 실행합니다.
4. 화면의 `/api` 호출은 Vite proxy를 통해 B/E `8090`으로 전달됩니다.

자세한 API 요청/응답 계약은 [README_API.md](./README_API.md)를 기준으로 합니다.
