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
```

## 주요 구조

| 경로 | 역할 |
| --- | --- |
| `src/main.js` | React root, Redux Provider, 앱 메뉴와 화면 전환 |
| `src/components/vc/nonBim/Bim5DNotApplied.js` | BIM/5D 미적용 Fab 화면 업무 연결 |
| `src/components/vc/nonBim/VcCalculator.js` | V/C Calculator 화면 업무 연결 |
| `src/components/vc/nonBim/ui` | 퍼블리셔가 교체하기 쉬운 JSX 그리드/폼 컴포넌트 |
| `src/components/vc/nonBim/popup` | 결과 및 표준 기안 첨부 팝업 |
| `src/store/vc` | Redux action/reducer/selector |
| `src/saga/vc/nonBim/vcSimSaga.js` | 화면 비동기 흐름과 API 호출 조정 |
| `src/service/api/vc/sim/vcSimApi.js` | V/C B/E 호출의 유일한 HTTP adapter |
| `src/components/vc/nonBim/core/NonBim.helper.js` | 요청 payload 생성과 응답 DTO 정규화 |
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
- B/E 응답 필드명이 달라질 경우 `NonBim.helper.js`의 normalize 함수에서 흡수합니다.
- `vcSimBEApi.js`는 사용하지 않으며 삭제했습니다.
- API 계약 변경 시 `vcSimApi.js`, Java Controller/DTO, `README_API.md`를 함께 수정합니다.
- 콤보 option, 조회 결과, 그리드 row 등 업무 데이터는 F/E 상수로 만들지 않고 B/E API에서 조회합니다.
- API 연동을 이유로 조회조건/콤보/그리드 위치를 임의 변경하지 않습니다. 화면 배치는 퍼블리싱/F/E 책임입니다.

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
- Foreline 다운로드는 `eqId + constructionNo`를 필수로 사용합니다.
- `drawingKey`, `fileId`는 다운로드용 보조 식별자입니다.
- radio 선택 후 Chamber/Spec 조회는 장비 기준 `eqId`를 중심으로 호출합니다.

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
