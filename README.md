# V/C Simulation F/E

React 18, Redux, Redux-Saga, Vite 기반 V/C Simulation 화면 프로젝트입니다.
Spring Boot B/E(`vcBePrj`)와 `/api` proxy로 연동하며, 화면 상태는 F/E가 관리하고 업무 데이터와 계산 결과는 B/E API 계약에 맞춰 주고받습니다.

## 실행 환경

| 항목 | 값 |
| --- | --- |
| F/E 개발 서버 | `http://localhost:5173` |
| B/E 서버 | `http://localhost:8090` |
| API 호출 경로 | F/E에서는 `/api/...` 상대 경로 사용 |
| Vite proxy | `/api` -> `http://localhost:8090` |

```powershell
npm install
npm run dev
```

Vite는 `strictPort: true`입니다. 5173 포트가 사용 중이면 다른 포트로 자동 이동하지 않고 실패합니다.

## 검증

```powershell
npm run build
npm run test:vc
```

`npm run test:vc`는 `scripts/verify-vc-calculation.mjs`를 실행합니다. 이 파일은 개발 검증용 Node script이며 운영 번들에 포함되는 화면 파일이 아닙니다.

## 회사 시스템 반영 기준

- `src/main.js`는 React root, Redux Provider, 좌측 메뉴/우측 content shell만 둡니다.
- 로컬 preview 스타일은 `src/main.js`에서만 `src/vc.css`를 import합니다.
- 업무 화면 컴포넌트는 `vc.css`를 직접 import하지 않습니다. 회사 시스템에 화면 컴포넌트만 붙이면 회사 시스템에 이미 있는 CSS가 className 기준으로 적용됩니다.
- 화면 className은 퍼블 소스 기준을 그대로 유지합니다. `searchStyle`, `vcsnofM001Style`, `buttonArea`, `tableScrollStyle`처럼 퍼블 원본에 가까운 class는 전역 class로 둡니다.
- `vc-`로 시작하는 class(`vc-pub-screen`, `vc-pub-section`, `vc-switch-field` 등)는 퍼블에서 쓰는 형태에 맞춰 그대로 유지합니다.
- 회사 시스템의 사용자 세션은 `state.userInfo?.user`에서 읽습니다.
- 현재 사용하는 세션 field:

| Field | 사용 위치 | 설명 |
| --- | --- | --- |
| `user.prjtCd` | Non-BIM, Calculator | FAB/project code. preview fallback은 `M16` |
| `user.empNo` | 추후 저장/작업자 mapping | B/E 저장 시 `workEmpno`, `regEmpno` 등에 매핑 가능 |

## 주요 구조

| 경로 | 역할 |
| --- | --- |
| `src/main.js` | React root, Redux Provider, app shell, menu routing |
| `src/vc.css` | 로컬 preview용 퍼블 호환 CSS. 회사 반영 시 화면 컴포넌트가 직접 import하지 않음 |
| `src/components/vc/nonBim/Bim5DNotApplied.js` | BIM/5D Not Applied Fab container |
| `src/components/vc/nonBim/VcCalculator.js` | V/C Calculator container |
| `src/components/vc/nonBim/ui` | 퍼블리셔가 보기 쉬운 JSX UI 영역 |
| `src/components/vc/nonBim/core/NonBim.helper.js` | DTO 조립, validation, result normalization |
| `src/components/vc/admin/SpecMaster.js` | V/C Spec Master 관리 화면과 등록/수정 팝업 |
| `src/store/vc` | Redux action/reducer/selector |
| `src/saga/vc/nonBim/vcSimSaga.js` | API 호출과 비동기 flow |
| `src/saga/vc/admin/specMasterSaga.js` | SpecMaster 조회, 상세, 저장, 삭제 flow |
| `src/service/api/vc/sim/vcSimApi.js` | V/C B/E API 단일 HTTP adapter |
| `src/service/api/vc/admin/specMasterApi.js` | SpecMaster B/E API adapter |

## 화면 동작 계약

### BIM/5D Not Applied Fab

- FAB 조회조건은 콤보가 아닙니다.
- `state.userInfo?.user?.prjtCd`를 읽어 readonly input에 표시하고, Redux search condition의 `fabCd`에도 같은 값을 넣습니다.
- preview 환경에서 세션이 없으면 `M16`을 fallback으로 사용합니다.
- EQ ID는 필수 검색조건입니다.
- Manual Drawing Results row 선택 key는 `woId`입니다.
- 기존 chamber tab 이름은 B/E가 내려준 `chamberName`을 유지합니다.
- 사용자가 추가한 chamber만 `CHAMBER{n}` 형식으로 번호를 붙입니다.
- Non-BIM은 Model Standard와 Min/Max Spec이 있어야 계산 대상 chamber가 됩니다.

### V/C Calculator

- FAB는 콤보를 유지합니다.
- 최초 진입 시 `state.userInfo?.user?.prjtCd`를 FAB 콤보의 초기 선택값으로 넣습니다.
- 사용자가 이후 FAB를 변경하는 동작은 허용합니다.
- 추후 readonly 요구가 있으면 `VcCalculator.js`의 FAB `SelectField`에서 `readOnly={false}`를 `true`로 변경하면 됩니다.
- Calculator chamber tab의 `modelStandard`, `minSpec`, `maxSpec`, `calculationTarget`은 tab-local 상태입니다.
- Model Standard 또는 Min/Max Spec이 없어도 pipe 필수값이 있으면 Calculate가 가능합니다.
- spec 없는 계산 결과는 conductance 계산값과 `judge: "NA"`로 표시합니다.

### Spec Master

- 메뉴 경로는 `V/C Administration > Spec Master`입니다.
- FAB 콤보는 회사 공통코드 API `/api/commcode/comm-code-list?mstCd=VC_FAB_ID&sysId=VC`를 원천으로 사용합니다.
- 좌측 Master Grid는 `upperCd`가 빈 상위 Spec만 보여줍니다.
- 우측 Detail Grid는 선택한 Master의 `specId`를 기준으로 `upperCd == specId`인 상세 Spec을 보여줍니다.
- Master 팝업에는 공정대분류, 공정중분류, CHAMBER SPEC을 노출하지 않습니다.
- Detail 팝업에는 상세스펙 유무와 수기등록 스위치를 노출하지 않습니다.
- Excel 다운로드는 선택 Master 1건과 Detail 전체를 서로 다른 표로 내려받습니다.
- 실제 SpecMaster API 계약은 [md/SPEC_MASTER_API.md](./md/SPEC_MASTER_API.md)를 기준으로 봅니다.

## API 관리 원칙

- 화면과 saga는 `vcSimApi.js`만 사용합니다.
- 중복 adapter(`vcSimBEApi.js`)는 두지 않습니다.
- B/E DTO field명은 Java record의 camelCase 이름을 그대로 사용합니다.
- 업무/DB 기준 `WO_ID`는 JSON에서 `woId`입니다.
- API 변경 시 아래 파일을 함께 확인합니다.

| 변경 대상 | 같이 확인할 파일 |
| --- | --- |
| Endpoint URL | `vcSimApi.js`, `VcSimController.java`, `README_API.md` |
| Request/Response field | `NonBim.helper.js`, `vcSimSaga.js`, Java DTO, `README_API.md` |
| 화면 표시/검증 규칙 | container, reducer, selector, `README.md` |
| SpecMaster API | `specMasterApi.js`, `specMasterSaga.js`, `VcSpecMasterController.java`, `SPEC_MASTER_API.md` |

상세 API 계약은 [README_API.md](./README_API.md)를 기준으로 합니다.
B/E 실행과 mock table 설명은 [vcBePrj/README.md](./vcBePrj/README.md)를 기준으로 합니다.
