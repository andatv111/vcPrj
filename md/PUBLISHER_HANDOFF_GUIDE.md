# 퍼블리셔 소스 반영 가이드

이 프로젝트에서는 퍼블리셔가 준 화면 소스를 그대로 복사하지 않고, 기존 F/E 기능 흐름 위에 마크업과 className을 입히는 방식으로 반영한다. Redux action, saga 호출 순서, B/E endpoint, payload key는 유지하고 화면 표현 계층만 교체하는 것이 기본 원칙이다.

화면 className은 퍼블 소스 기준을 그대로 유지한다. 퍼블에서 온 `searchStyle`, `vcsnofM001Style`, `vcsnofP001Style`, `buttonArea`, `partArea`, `tableScrollStyle` 같은 class는 전역 class처럼 둔다. `vc-pub-*`, `vc-switch-*`처럼 `vc-`가 붙은 class도 퍼블 기준에 맞춰 그대로 유지한다.

회사 시스템 반영 시에는 화면 컴포넌트가 `vc.css`를 직접 import하지 않는다. 현재 `src/vc.css`는 로컬 preview용이며 `src/main.js`에서만 import한다. 회사 시스템에 `SpecMgmt.js` 같은 화면 컴포넌트를 붙이면, className은 그대로 두고 회사 쪽에 이미 있는 CSS가 적용되는 구조다.

## 이번 반영 기준

- `Model2.js`의 `VcsnofM001Style`, `SearchStyle`, `VcsnofP001Style`, `TableScrollStyle` 개념을 `src/vc.css`의 호환 class로 옮겼다.
- Non-BIM과 Calculator의 업무 상태, API 흐름, 결과 저장 흐름은 기존 컨테이너와 saga를 유지했다.
- 결과 팝업과 기안 첨부 팝업도 퍼블 대상에 포함했다. 공통 팝업 state는 `vcResult` slice가 계속 소유한다.
- 신규 Admin 화면 `SpecMgmt.js`에도 같은 퍼블 사상을 적용했다. Search Conditions, 좌우 grid, 등록/수정 팝업 모두 `searchStyle`, `vcsnofM001Style`, `vcsnofP001Style`, `vc-pub-popup` 계열 class를 사용한다.
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
   - 화면 class는 회사 CSS가 전역으로 처리할 수 있게 퍼블 className 그대로 유지한다.

3. 컨테이너와 UI 파일 경계를 지킨다.
   - 컨테이너: Redux selector, dispatch, 화면 흐름 제어
   - `ui/*.js`: input/select/table/button JSX와 className
   - `popup/*.js`: modal header/body/footer JSX와 className
   - `core/*.js`: payload 생성, validation, normalize, 비즈니스 규칙

4. 팝업도 메인 화면과 같이 반영한다.
   - 결과 팝업: `src/components/vc/nonBim/popup/VcResultPopup.js`
   - 기안 첨부 팝업: `src/components/vc/nonBim/popup/VcDraftAttachPopup.js`
   - SpecMaster 등록/수정 팝업: `src/components/vc/admin/spec/pop/SpecMgmtPopup.js`
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

현재 `src/vc.css`는 로컬 preview용 퍼블 호환 CSS다. 실제 회사 시스템에 반영할 때는 다음 기준으로 정리한다.

- 회사 시스템에 이미 CSS가 있으면: 화면 컴포넌트에서 CSS import를 추가하지 않는다.
- 회사 CSS 파일명이 확정된 경우: 회사 shell 또는 공통 layout 쪽에서 import한다.
- 화면별 CSS가 별도로 제공되는 경우: 회사 프로젝트의 정해진 위치에서 import하고, React 화면 파일의 className은 그대로 둔다.
- `src/vc.css`는 preview 확인용이므로 회사 반영 산출물에는 포함하지 않아도 된다.

기능이 맞는지 헷갈리면 className을 먼저 붙이고, 이벤트 핸들러와 Redux action은 기존 코드를 따라가면 된다.

## 퍼블 소스에서 현재 코드로 옮긴 방식

퍼블리셔가 준 소스는 화면 모양을 잡는 데 사용하고, 업무 상태와 API 흐름은 기존 개발 코드에 남긴다. 그래서 “퍼블 코드를 복사”한 것이 아니라 아래처럼 className과 영역 구조만 옮겼다.

### 1. SearchStyle은 SearchPanel로 옮김

퍼블 소스의 검색 영역 개념:

```jsx
<SearchStyle>
  <select>FAB</select>
  <select>MODEL</select>
  <button>조회</button>
</SearchStyle>
```

현재 코드:

```jsx
const SearchPanel = ({ search, options, loading, onChange, onReset, onSearch }) => (
  <section className="panel vc-pub-section searchStyle">
    <div className="section-title">Search Conditions</div>
    <div className="search-row vc-pub-search-row">
      <SelectField label="FAB" value={search.fabId} options={options.fabIds} onChange={(value) => onChange("fabId", value)} />
      <SelectField label="MODEL" value={search.setModelNm} options={options.setModelNms} onChange={(value) => onChange("setModelNm", value)} />
      <SelectField label="모델관리기준" value={search.specNm} options={options.specNms} onChange={(value) => onChange("specNm", value)} />
      <button type="button" className="secondary-button" disabled={loading.search} onClick={onReset}>초기화</button>
      <button type="button" className="primary-button" disabled={loading.search} onClick={onSearch}>조회</button>
    </div>
  </section>
);
```

여기서 퍼블 반영 포인트는 `searchStyle`, `vc-pub-search-row`, 버튼 class다. 검색 조건 값은 `useState`로 새로 만들지 않고 Redux `search` state를 그대로 사용한다.

### 2. VcsnofM001Style은 Master/Detail Grid로 옮김

퍼블 소스의 본문 table 영역 개념:

```jsx
<VcsnofM001Style>
  <div className="buttonArea">...</div>
  <TableScrollStyle>
    <table>...</table>
  </TableScrollStyle>
</VcsnofM001Style>
```

현재 코드:

```jsx
<section className="panel vc-pub-section vcsnofM001Style spec-master-panel">
  <div className="section-header">
    <div className="section-title">Master Grid</div>
    <div className="button-group buttonArea">
      <button type="button" className="secondary-button" onClick={onCreate}>신규</button>
      <button type="button" className="secondary-button" disabled={!selectedSpecId} onClick={onEdit}>수정</button>
      <button type="button" className="secondary-button" disabled={!selectedSpecId} onClick={onDelete}>삭제</button>
    </div>
  </div>
  <div className="table-wrap tableScrollStyle">
    <table>...</table>
  </div>
</section>
```

Master Grid와 Detail Grid는 같은 퍼블 class를 쓰지만 데이터 의미가 다르다.

| 영역 | 데이터 기준 | 현재 컴포넌트 |
| --- | --- | --- |
| 좌측 Master Grid | `upperCd`가 빈 row | `MasterGridPanel` |
| 우측 Detail Grid | `upperCd == selectedMaster.specId` | `DetailGridPanel` |

### 3. VcsnofP001Style은 SpecMgmtPopup으로 옮김

퍼블 소스의 팝업 개념:

```jsx
<VcsnofP001Style>
  <div className="popup">
    <div className="popup-body">...</div>
    <div className="buttonArea">...</div>
  </div>
</VcsnofP001Style>
```

현재 코드:

```jsx
<div className="modal-dim vcsnofP001Style">
  <div className="modal spec-master-modal vc-pub-popup">
    <div className="modal-header">...</div>
    <div className="popup-body partArea">...</div>
    <div className="footer-actions popup-actions buttonArea">...</div>
  </div>
</div>
```

팝업은 하나지만 `popup.scope` 값으로 Master/Detail 입력 항목을 나눈다.

```jsx
{isDetail ? (
  <>
    <SelectField label="공정대분류" required ... />
    <SelectField label="공정중분류" required ... />
    <SelectField label="CHAMBER SPEC" required ... />
  </>
) : null}

{isMaster ? <SwitchField label="상세스펙 유무" ... /> : null}
{isMaster ? <SwitchField label="수기등록" ... /> : null}
<SwitchField label="사용여부" ... />
```

즉 Master 팝업에는 공정/Chamber를 숨기고, Detail 팝업에는 상세스펙 유무와 수기등록을 숨긴다.

### 4. Switch 퍼블은 checkbox 기능 위에 class만 입힘

퍼블에서 switch처럼 보이던 항목은 실제 업무값이 `Y/N`이다. 그래서 화면에는 switch로 보이게 하고, 값은 그대로 `Y/N`으로 Redux에 저장한다.

현재 코드:

```jsx
const SwitchField = ({ label, value, onChange }) => (
  <label className="vc-switch-field spec-switch">
    <span className="vc-switch-label">{label}</span>
    <input type="checkbox" checked={value === "Y"} onChange={(event) => onChange(event.target.checked ? "Y" : "N")} />
    <span className="vc-switch-track" aria-hidden="true">
      <span className="vc-switch-thumb" />
    </span>
    <span className="vc-switch-value">{value === "Y" ? "Y" : "N"}</span>
  </label>
);
```

CSS:

```css
.vc-switch-field input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.vc-switch-field input:checked + .vc-switch-track {
  border-color: #2f6f73;
  background: #2f6f73;
}
```

숨겨진 checkbox는 값 전달용이고, 실제로 사용자가 보는 모양은 `vc-switch-track`과 `vc-switch-thumb`이다.

### 5. Excel 버튼은 퍼블 버튼만 반영하고 다운로드 로직은 유지

퍼블의 다운로드 버튼 모양은 `download-button`, `download-icon` class로 옮겼다.

```jsx
<button type="button" className="secondary-button download-button" disabled={!selectedMaster} onClick={onExcel}>
  <span className="download-icon" aria-hidden="true" />
  Excel
</button>
```

다운로드 데이터는 화면 사상에 맞춰 Master와 Detail을 분리한다.

```js
downloadExcel({
  selectedMaster,
  detailRows,
});
```

Master와 Detail은 컬럼이 다르므로 하나의 CSV row로 합치지 않고, Excel에서 열 수 있는 HTML table 두 개로 만든다.

### 6. 퍼블 반영 시 유지해야 할 연결선

퍼블 소스를 다시 받더라도 아래 연결선은 바꾸지 않는다.

| 화면 조작 | 유지해야 할 개발 코드 |
| --- | --- |
| Search Conditions 값 변경 | `specMasterActions.setSearchField` |
| 조회 버튼 | `specMasterActions.searchRequest` |
| Master radio 선택 | `specMasterActions.selectMaster` |
| Detail 조회 | `specMasterActions.searchRequest({ selectedSpecId })` |
| 신규/수정 팝업 열기 | `openCreatePopup`, `openEditPopup` |
| 팝업 값 변경 | `setPopupField` |
| 저장 | `saveRequest` |
| 삭제 | `deleteRequest` |

퍼블은 className, table 구조, popup markup을 조정하고, 위 action과 saga/API 흐름은 그대로 둔다.
