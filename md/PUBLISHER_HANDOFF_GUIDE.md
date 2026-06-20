# 퍼블리셔 소스 반영 가이드

이 프로젝트에서는 퍼블리셔가 준 화면 소스를 그대로 복사하지 않고, 기존 F/E 기능 흐름 위에 마크업과 className을 입히는 방식으로 반영한다. Redux action, saga 호출 순서, B/E endpoint, payload key는 유지하고 화면 표현 계층만 교체하는 것이 기본 원칙이다.

## 이번 반영 기준

- `Model2.js`의 `VcsnofM001Style`, `SearchStyle`, `VcsnofP001Style`, `TableScrollStyle` 개념을 `src/vc.css`의 호환 class로 옮겼다.
- Non-BIM과 Calculator의 업무 상태, API 흐름, 결과 저장 흐름은 기존 컨테이너와 saga를 유지했다.
- 결과 팝업과 기안 첨부 팝업도 퍼블 대상에 포함했다. 공통 팝업 state는 `vcResult` slice가 계속 소유한다.
- 신규 Admin 화면 `SpecMaster.js`에도 같은 퍼블 사상을 적용했다. Search Conditions, 좌우 grid, 등록/수정 팝업 모두 `searchStyle`, `vcsnofM001Style`, `vcsnofP001Style`, `vc-pub-popup` 계열 class를 사용한다.
- SpecMaster는 F/E만 만든 화면이 아니다. 로컬 B/E에 `/api/vc/specmaster/...`와 `/api/commcode/comm-code-list`를 구현했고, `VCW_VC_SPEC_MST.txt`에 Master/Detail 샘플 데이터도 넣었다.
- 체크 성격의 항목 중 퍼블이 switch로 잡은 값은 `vc-switch-field`로 표현한다. Non-BIM의 `Calculation Target`, SpecMaster의 상세스펙 유무, 수기등록, 사용여부가 여기에 해당한다.
- SpecMaster 팝업은 Master와 Detail의 입력 항목을 분리한다. Master 팝업에는 공정대분류, 공정중분류, CHAMBER SPEC을 숨기고, Detail 팝업에는 상세스펙 유무와 수기등록을 숨긴다.
- SpecMaster Excel 다운로드는 선택한 Master 1건과 현재 Detail Grid 전체를 같은 파일 안의 별도 표로 내려받는다. Master와 Detail은 컬럼 구성이 달라 한 grid처럼 합치지 않는다.

## 퍼블 소스 받을 때 작업 순서

1. 퍼블 소스의 임시 비즈니스 코드를 먼저 제거한다.
   - 임시 `useState`, 임시 `handleChange`, `console.log`, 샘플 modal state는 참고만 한다.
   - 기존 조회, 저장, 계산, 다운로드 action은 유지한다.

2. 화면을 업무 영역으로 나눈다.
   - 검색 조건: `SearchStyle`, `searchStyle`, `vc-pub-search-row`
   - 본문 grid: `VcsnofM001Style`, `vcsnofM001Style`, `partArea`
   - 팝업: `VcsnofP001Style`, `vcsnofP001Style`, `vc-pub-popup`, `popup-body`, `popup-actions`

3. 컨테이너와 UI 파일 경계를 지킨다.
   - 컨테이너: Redux selector, dispatch, 화면 흐름 제어
   - `ui/*.js`: input/select/table/button JSX와 className
   - `popup/*.js`: modal header/body/footer JSX와 className
   - `core/*.js`: payload 생성, validation, normalize, 비즈니스 규칙

4. 팝업도 메인 화면과 같이 반영한다.
   - 결과 팝업: `src/components/vc/nonBim/popup/VcResultPopup.js`
   - 기안 첨부 팝업: `src/components/vc/nonBim/popup/VcDraftAttachPopup.js`
   - SpecMaster 등록/수정 팝업: `src/components/vc/admin/SpecMaster.js`의 `SpecMasterPopup`
   - 팝업 안의 table은 `tableScrollStyle`, 버튼 영역은 `buttonArea`, 본문 묶음은 `partArea`를 우선 사용한다.
   - 팝업 안에서 Y/N 값을 switch로 표현할 때는 실제 값 변환은 기존 handler에 맡기고, 퍼블은 `vc-switch-field`, `vc-switch-track`, `vc-switch-thumb`, `vc-switch-value` class만 맞춘다.

5. 이미지 자산은 className 뒤에 숨긴다.
   - 퍼블 소스의 아이콘 import는 운영 반영 시 CSS `background-image`로 연결하는 편이 안전하다.
   - 예: `.pipe-type-icon.elbow { background-image: url("/assets/icon/ElbowIcon.png"); }`

6. 변경 후 확인한다.
   - `npm run build`
   - `npm run test:vc`
   - B/E 변경이 포함된 경우 `vcBePrj`에서 `mvn test`
   - SpecMaster는 B/E 재시작 후 Master Grid와 Detail Grid에 데이터가 모두 나오는지 확인한다.

## 금지할 것

- 퍼블 className을 맞추기 위해 B/E endpoint 이름이나 payload key를 바꾸지 않는다.
- `src/main.js`에 화면 CSS나 업무 로직을 추가하지 않는다.
- Calculator의 chamber별 `modelStandard` 상태를 전역처럼 공유하지 않는다.
- Non-BIM 저장 완료/기안 첨부 상태로 전체 메뉴 이동까지 막지 않는다.
- 결과 저장 흐름을 화면별로 새로 만들지 않는다. `vcResult`가 결과/기안 첨부 팝업의 공통 소유자다.
- 퍼블상 switch인 항목을 일반 checkbox처럼 화면에 노출하지 않는다. hidden checkbox input은 접근성과 값 전달용이고, 사용자가 보는 UI는 switch track/thumb이다.
- SpecMaster Excel에서 Master 컬럼과 Detail 컬럼을 한 표에 섞지 않는다. 좌측은 선택 Master, 우측은 Detail 전체라는 화면 사상을 유지한다.

## 회사 CSS를 받았을 때 연결 위치

현재는 `src/vc.css`에 퍼블 호환 class가 들어 있다. 실제 회사 CSS 파일을 받으면 다음 중 하나로 정리한다.

- 파일명이 확정된 경우: 회사 CSS 파일을 추가하고 해당 화면 컨테이너에서 import한다.
- 화면별 CSS가 많은 경우: 해당 화면 또는 `ui/`, `popup/` 근처에 CSS를 두고 해당 컴포넌트가 import한다.
- 공통 table/scroll/button CSS인 경우: `src/vc.css` 또는 공통 styles 파일로 올린다.

기능이 맞는지 헷갈리면 className을 먼저 붙이고, 이벤트 핸들러와 Redux action은 기존 코드를 따라가면 된다.
