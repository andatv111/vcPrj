# V/C Simulation F/E

React 18, Redux, Redux-Saga, Vite 기반의 V/C Simulation 화면 프로젝트입니다. Spring Boot B/E(`vcBePrj`)와 `/api` 프록시로 연동하며, 화면의 위치와 사용 흐름은 유지하고 Java DTO와 API 계약에 맞춰 데이터를 주고받습니다.

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

`npm run test:vc`는 `scripts/verify-vc-calculation.mjs`를 실행합니다. 이 파일은 개발 검증용 Node 스크립트이며 React 화면에서 import하지 않으므로 운영 런타임 번들에는 들어가지 않습니다.

회사 시스템 반입 기준:

- 화면 운영 소스만 반입할 때는 `src/`, `package.json`, 필요한 설정 파일을 기준으로 반영합니다.
- `scripts/verify-vc-calculation.mjs`는 반입해도 무방한 개발 검증 도구입니다. 다만 운영 서버에서 실행되는 파일은 아닙니다.
- 회사 배포 정책상 검증 스크립트를 제외해야 하면 `npm run test:vc`를 실행할 수 없다는 점만 감수하면 됩니다.
- 앞으로 새 `.mjs` 파일이 생기면 반드시 `scripts/` 아래 개발 검증 목적이어야 하며, 화면 코드에서 import하지 않는 것을 원칙으로 합니다.

`npm run test:vc`는 화면 검증의 핵심입니다. 다음 의도가 깨지면 실패합니다.

- Non-BIM FAB 콤보가 B/E 옵션 응답에서 유지됩니다.
- Non-BIM은 `modelStandard`가 비면 해당 Chamber의 `calculationTarget`이 false가 됩니다.
- Non-BIM 계산 전 검증은 Model Standard와 Min/Max Spec을 요구합니다.
- Calculator는 Model Standard와 Min/Max Spec이 없어도 배관 필수값이 있으면 계산 요청을 허용합니다.
- Calculator의 spec 없는 산출 결과는 conductance 계산값을 유지하고 `judge: "NA"`로 정규화됩니다.
- Calculator Chamber 탭의 `modelStandard`는 탭별 상태로 유지되며 다른 탭에 전파되지 않습니다.

## 주요 구조

| 경로 | 역할 |
| --- | --- |
| `src/main.js` | React root와 Redux Provider만 담당합니다. 화면별 업무 스타일은 각 화면에서 import합니다. |
| `src/components/vc/nonBim/Bim5DNotApplied.js` | BIM/5D Not Applied Fab 화면의 container입니다. 검색, 선택, 계산 action을 Redux에 연결합니다. |
| `src/components/vc/nonBim/VcCalculator.js` | V/C Calculator 화면의 container입니다. Calculator 전용 장비 조건과 Chamber 편집 흐름을 연결합니다. |
| `src/components/vc/nonBim/ui` | 퍼블리셔가 보기 쉬운 JSX 영역입니다. 테이블, 폼, Chamber/Pipe UI를 이곳에 둡니다. |
| `src/components/vc/nonBim/core/NonBim.helper.js` | 화면 공통 규칙, DTO 조립, 검증, 결과 정규화를 담당합니다. |
| `src/store/vc` | Redux action/reducer/selector입니다. 화면은 root state를 직접 읽지 않고 selector를 사용합니다. |
| `src/saga/vc/nonBim/vcSimSaga.js` | API 호출, 응답 정규화, 비동기 흐름을 담당합니다. |
| `src/service/api/vc/sim/vcSimApi.js` | V/C B/E API 단일 HTTP adapter입니다. |

## 화면 동작 계약

### BIM/5D Not Applied Fab

- Search Conditions의 FAB, EQ ID, WO ID 위치와 사용 방식은 유지합니다.
- FAB 목록은 `GET /api/vc/sim/non-bim/options`의 `fabs`에서 가져옵니다.
- EQ ID는 필수 검색 조건입니다.
- 상단 Manual Drawing Results의 업무 key는 `woId`입니다.
- F/E 내부 row 렌더링용 `id`는 `eqId + woId`로 만든 화면 key이며, B/E DTO 필드가 아닙니다.
- 설계포탈 조회 DTO는 `woId`, `eqId`, `siteCd/siteNm`, `fabCd/fabNm`, `area/areaDetail`, `chgType1/chgType1Nm`, `catNm`, `file/fileSeq/fileNm`을 사용합니다.
- 기존 Chamber 이름은 B/E 응답의 `chamberName`을 유지합니다. 사용자가 추가한 Chamber만 `CHAMBER{n}`으로 번호를 붙입니다.
- Model Standard가 없거나 Min/Max Spec이 없으면 Non-BIM의 해당 Chamber는 산출대상에서 빠집니다.

### V/C Calculator

- Calculator는 Non-BIM보다 느슨합니다.
- FAB + MODEL은 Model Standard 옵션 필터에만 사용합니다.
- 각 Chamber 탭은 자기 `modelStandard`, `minSpec`, `maxSpec`, `calculationTarget`을 독립적으로 가집니다.
- 한 탭에서 Model Standard를 바꿔도 다른 탭의 Model Standard를 덮어쓰지 않습니다.
- Model Standard 또는 Min/Max Spec이 없어도 배관 필수값이 있으면 Calculate를 실행할 수 있습니다.
- spec 없이 산출한 행은 결과 팝업에서 conductance 계산값과 `NA` 판정으로 보입니다.

## API 관리 원칙

- 화면과 saga는 `vcSimApi.js`만 사용합니다.
- B/E DTO 필드명은 Java record의 camelCase 이름을 그대로 씁니다.
- 업무 키는 DB/테이블 기준 `WO_ID`, F/E/B/E JSON 기준 `woId`입니다.
- `vcSimBEApi.js` 같은 중복 adapter는 두지 않습니다.
- API 계약 변경 시 Java DTO, `vcSimApi.js`, `README_API.md`, 관련 테스트를 함께 수정합니다.

## 로컬 연동 순서

1. STS/Eclipse에서 `vcBePrj`를 `http://localhost:8090`으로 실행합니다.
2. F/E 루트에서 `npm run dev`를 실행합니다.
3. 브라우저에서 `http://localhost:5173`을 엽니다.
4. 화면 호출은 Vite proxy를 통해 B/E 8090으로 전달됩니다.

상세 API 계약은 [README_API.md](./README_API.md), B/E 실행과 mock table 설명은 [vcBePrj/README.md](./vcBePrj/README.md)를 기준으로 합니다.
