# SPEC Master API

구분: SPEC 마스터
테스트: B/E
기준 화면: `src/components/vc/admin/SpecMaster.js`
기준 Controller: `vcBePrj/src/main/java/com/example/vcbeprj/controller/VcSpecMasterController.java`
기준 DB/mock table: `VCW_VC_SPEC_MST`

이 문서는 현재 프로그램에서 실제로 도는 API 기준이다. GoodDocs 초안에 있던 `selectpaging`, `selectleftpaging`, `selectcondition`, 조회용 `children` API는 현재 화면 계약에서 제외한다.

## API Summary

구분: SPEC 마스터
테스트: B/E

| 순서 | METHOD | API Name(URL) | 기능설명 |
| --- | --- | --- | --- |
| 1 | GET | `/api/commcode/comm-code-list?mstCd=VC_FAB_ID&sysId=VC` | SpecMaster 화면 Search Conditions와 팝업 FAB 콤보의 공통코드 조회 |
| 2 | GET | `/api/vc/specmaster/selectfilteroptions` | MODEL, 모델관리기준, 공정대분류, 공정중분류, CHAMBER SPEC 콤보 후보 조회 |
| 3 | POST | `/api/vc/specmaster/search` | 좌측 Master Grid 원천 데이터와 선택 Master의 우측 Detail Grid 데이터를 함께 조회 |
| 4 | POST | `/api/vc/specmaster` | 좌측 Master Grid에 들어갈 상위 Spec Master row 신규 등록 |
| 5 | POST | `/api/vc/specmaster/{specId}/children` | 선택 Master 아래 우측 Detail Grid row 신규 등록 |
| 6 | PATCH | `/api/vc/specmaster/{specId}` | 좌측 Master Grid 또는 우측 Detail Grid 선택 row 수정 |
| 7 | DELETE | `/api/vc/specmaster/{specId}` | 좌측 Master Grid 또는 우측 Detail Grid 선택 row 삭제 |
| 8 | POST | `/api/vc/specmaster/selectexact` | FAB, MODEL, 공정, CHAMBER SPEC 정확 일치 Spec row 조회 |

## DB Row Shape

`VCW_VC_SPEC_MST`는 Master와 Detail을 같은 row 구조로 저장한다.

- Master row: `upperCd`가 빈 값이다.
- Detail row: `upperCd`에 부모 Master의 `specId`가 들어간다.
- 좌측 Master Grid: `upperCd`가 빈 Master row만 표시한다.
- 우측 Detail Grid: 선택된 Master의 `specId`와 Detail row의 `upperCd`가 일치하는 row만 표시한다.

공통 row 필드:

```json
{
  "specId": "SPEC-M14-LITHO-A",
  "specNm": "M14 Litho Track",
  "fabId": "M14",
  "setModelNm": "LITHO-Track-4",
  "operLargeCatgVal": "LITHO",
  "operMidCatgVal": "Coater",
  "chambModelNm": "LITHO-STD-A",
  "modelSpecUseYn": "0",
  "srcGbnCd": "M",
  "detSearYn": "N",
  "upperCd": "",
  "mgmtTgtYn": "Y",
  "specMinVal": 36,
  "specMaxVal": 90,
  "chgrEmpno": "100310",
  "chgrNm": "S. Choi",
  "specDesc": "Filter sample master",
  "regTm": "",
  "regEmpno": "",
  "chgDtNm": "",
  "chgChgrEmpno": ""
}
```

## 1. FAB 공통코드 조회

METHOD: `GET`

API Name(URL): `/api/commcode/comm-code-list?mstCd=VC_FAB_ID&sysId=VC`

기능설명: SpecMaster Search Conditions와 팝업 FAB 콤보의 원천 데이터를 조회한다. FAB는 SpecMaster table에서 임의 추출하지 않고 회사 공통코드 성격의 API를 우선 사용한다.

입력파라미터:

- `mstCd`: `VC_FAB_ID`
- `sysId`: `VC`

입력샘플:

```txt
GET /api/commcode/comm-code-list?mstCd=VC_FAB_ID&sysId=VC
```

출력값샘플:

```json
[
  { "value": "M12", "label": "M12" },
  { "value": "M13", "label": "M13" },
  { "value": "M14", "label": "M14" },
  { "value": "M15", "label": "M15" },
  { "value": "M16", "label": "M16" }
]
```

## 2. SpecMaster 필터 옵션 조회

METHOD: `GET`

API Name(URL): `/api/vc/specmaster/selectfilteroptions`

기능설명: Search Conditions, Master/Detail 등록 팝업에서 사용하는 모델, 모델관리기준, 공정대분류, 공정중분류, CHAMBER SPEC 후보값을 조회한다. 이 API는 그리드 데이터를 조회하는 API가 아니라 콤보 후보 초기화용이다.

입력파라미터: 없음

입력샘플:

```txt
GET /api/vc/specmaster/selectfilteroptions
```

출력값샘플:

```json
{
  "fabIds": ["M12", "M13", "M14", "M15", "M16"],
  "areas": [],
  "makers": [],
  "setModelNms": ["CVD-Legacy-2", "DRY-Etch-10", "LITHO-Track-4"],
  "specNms": ["M12 CVD Legacy Standard", "M13 Dry Etch Standard", "M14 Litho Track"],
  "operLargeCatgVals": ["CVD", "ETCH", "LITHO"],
  "operMidCatgVals": ["Coater", "Deposition", "Dry Etch"],
  "chambModelNms": ["CVD-M12-A", "DRY-STD-A", "LITHO-STD-A"],
  "rows": [
    {
      "specId": "SPEC-M14-LITHO-A",
      "specNm": "M14 Litho Track",
      "fabId": "M14",
      "setModelNm": "LITHO-Track-4",
      "upperCd": "",
      "specMinVal": 36,
      "specMaxVal": 90,
      "chgrNm": "S. Choi"
    }
  ]
}
```

## 3. 좌측 Master Grid 조회 + 선택 Master Detail 동시 조회

METHOD: `POST`

API Name(URL): `/api/vc/specmaster/search`

기능설명: SpecMaster 화면의 핵심 조회 API다. 좌측 Master Grid에 표시할 Master row를 paging 형태로 조회하고, 같은 응답에 선택된 Master의 우측 Detail Grid row를 함께 내려준다. 최초 로딩처럼 `selectedSpecId`가 없으면 B/E는 조회된 Master page의 첫 번째 row를 선택값으로 내려준다. F/E는 이 응답을 받은 뒤 grid 헤더 필터와 grid 페이지 이동을 화면 내부에서 처리한다.

입력파라미터:

- `page`: B/E 조회 page. 현재 F/E는 화면 내부 필터/페이징을 위해 `0`으로 조회한다.
- `size`: B/E 조회 size. 현재 F/E는 화면 내부 필터/페이징 후보를 충분히 받기 위해 크게 조회한다.
- `fabId`: Search Conditions FAB.
- `setModelNm`: Search Conditions MODEL.
- `specNm`: Search Conditions 모델관리기준.
- `selectedSpecId`: 우측 Detail Grid를 함께 조회할 부모 Master `specId`.
- `selectedDetailSpecId`: 저장 후 우측 Detail radio 선택을 복구하기 위한 Detail `specId`.

입력샘플:

```json
{
  "page": 0,
  "size": 500,
  "fabId": "M14",
  "setModelNm": "LITHO-Track-4",
  "specNm": "Litho",
  "selectedSpecId": "SPEC-M14-LITHO-A",
  "selectedDetailSpecId": "SPEC-M14-LITHO-A-CH03"
}
```

출력값샘플:

```json
{
  "content": [
    {
      "specId": "SPEC-M14-LITHO-A",
      "specNm": "M14 Litho Track",
      "fabId": "M14",
      "setModelNm": "LITHO-Track-4",
      "operLargeCatgVal": "LITHO",
      "operMidCatgVal": "Coater",
      "chambModelNm": "LITHO-STD-A",
      "modelSpecUseYn": "0",
      "srcGbnCd": "M",
      "detSearYn": "N",
      "upperCd": "",
      "mgmtTgtYn": "Y",
      "specMinVal": 36,
      "specMaxVal": 90,
      "chgrEmpno": "100310",
      "chgrNm": "S. Choi",
      "specDesc": "Filter sample master",
      "regTm": "",
      "regEmpno": "",
      "chgDtNm": "",
      "chgChgrEmpno": ""
    }
  ],
  "rows": [
    {
      "specId": "SPEC-M14-LITHO-A",
      "specNm": "M14 Litho Track",
      "fabId": "M14",
      "setModelNm": "LITHO-Track-4",
      "upperCd": "",
      "specMinVal": 36,
      "specMaxVal": 90,
      "chgrNm": "S. Choi"
    }
  ],
  "number": 0,
  "page": 0,
  "size": 500,
  "totalPages": 1,
  "totalElements": 1,
  "selectedSpecId": "SPEC-M14-LITHO-A",
  "details": [
    {
      "specId": "SPEC-M14-LITHO-A-CH03",
      "specNm": "M14 Litho Develop Chamber",
      "fabId": "M14",
      "setModelNm": "LITHO-Track-4",
      "operLargeCatgVal": "LITHO",
      "operMidCatgVal": "Developer",
      "chambModelNm": "LITHO-DEV-03",
      "modelSpecUseYn": "0",
      "srcGbnCd": "M",
      "detSearYn": "N",
      "upperCd": "SPEC-M14-LITHO-A",
      "mgmtTgtYn": "Y",
      "specMinVal": 41,
      "specMaxVal": 89,
      "chgrEmpno": "100312",
      "chgrNm": "Y. Han",
      "specDesc": "Detail spec for litho develop",
      "regTm": "",
      "regEmpno": "",
      "chgDtNm": "",
      "chgChgrEmpno": ""
    }
  ]
}
```

## 4. Master 신규 등록

METHOD: `POST`

API Name(URL): `/api/vc/specmaster`

기능설명: 좌측 Master Grid에 들어갈 상위 Spec row를 생성한다. Master row이므로 `upperCd`는 빈 값으로 저장된다. 공정대분류, 공정중분류, CHAMBER SPEC은 Detail 성격이 강하므로 Master 팝업에서는 기본 노출하지 않는다.

입력파라미터: request body의 SpecMaster row 필드

입력샘플:

```json
{
  "specNm": "M13 Dry Etch Standard",
  "fabId": "M13",
  "setModelNm": "DRY-Etch-10",
  "modelSpecUseYn": "0",
  "srcGbnCd": "U",
  "detSearYn": "N",
  "mgmtTgtYn": "Y",
  "specMinVal": 31,
  "specMaxVal": 73,
  "chgrEmpno": "100410",
  "chgrNm": "B. Kang",
  "specDesc": "Created from SpecMaster Master popup",
  "regEmpno": "100410",
  "chgChgrEmpno": "100410"
}
```

출력값샘플:

```json
{
  "specId": "SPEC-4f7b9144-642a-406a-b9b5-aa2b1195fa95",
  "specNm": "M13 Dry Etch Standard",
  "fabId": "M13",
  "setModelNm": "DRY-Etch-10",
  "operLargeCatgVal": "",
  "operMidCatgVal": "",
  "chambModelNm": "",
  "modelSpecUseYn": "0",
  "srcGbnCd": "U",
  "detSearYn": "N",
  "upperCd": "",
  "mgmtTgtYn": "Y",
  "specMinVal": 31,
  "specMaxVal": 73,
  "chgrEmpno": "100410",
  "chgrNm": "B. Kang",
  "specDesc": "Created from SpecMaster Master popup",
  "regTm": "2026-06-21T13:37:05.259132200+09:00",
  "regEmpno": "100410",
  "chgDtNm": "2026-06-21T13:37:05.259132200+09:00",
  "chgChgrEmpno": "100410"
}
```

## 5. Detail 신규 등록

METHOD: `POST`

API Name(URL): `/api/vc/specmaster/{specId}/children`

기능설명: 우측 Detail Grid에 들어갈 하위 Spec row를 생성한다. path의 `{specId}`는 부모 Master의 `specId`이고, 저장되는 Detail row의 `upperCd`가 된다. Detail 등록 후 F/E는 `/search`를 다시 호출해서 같은 Master radio를 유지하고 우측 Detail Grid를 최신화한다.

입력파라미터:

- path `specId`: 부모 Master `specId`
- request body: Detail row 필드

입력샘플:

```json
{
  "specNm": "M14 Litho Develop Chamber",
  "fabId": "M14",
  "setModelNm": "LITHO-Track-4",
  "operLargeCatgVal": "LITHO",
  "operMidCatgVal": "Developer",
  "chambModelNm": "LITHO-DEV-03",
  "modelSpecUseYn": "0",
  "srcGbnCd": "U",
  "detSearYn": "N",
  "mgmtTgtYn": "Y",
  "specMinVal": 41,
  "specMaxVal": 89,
  "chgrEmpno": "100312",
  "chgrNm": "Y. Han",
  "specDesc": "Created from SpecMaster Detail popup",
  "regEmpno": "100312",
  "chgChgrEmpno": "100312"
}
```

출력값샘플:

```json
{
  "specId": "SPEC-649ff11f-0bca-4d3b-8800-5b25379ce5d6",
  "specNm": "M14 Litho Develop Chamber",
  "fabId": "M14",
  "setModelNm": "LITHO-Track-4",
  "operLargeCatgVal": "LITHO",
  "operMidCatgVal": "Developer",
  "chambModelNm": "LITHO-DEV-03",
  "modelSpecUseYn": "0",
  "srcGbnCd": "U",
  "detSearYn": "N",
  "upperCd": "SPEC-M14-LITHO-A",
  "mgmtTgtYn": "Y",
  "specMinVal": 41,
  "specMaxVal": 89,
  "chgrEmpno": "100312",
  "chgrNm": "Y. Han",
  "specDesc": "Created from SpecMaster Detail popup",
  "regTm": "2026-06-21T13:37:05.259132200+09:00",
  "regEmpno": "100312",
  "chgDtNm": "2026-06-21T13:37:05.259132200+09:00",
  "chgChgrEmpno": "100312"
}
```

## 6. Master/Detail 수정

METHOD: `PATCH`

API Name(URL): `/api/vc/specmaster/{specId}`

기능설명: 좌측 Master Grid 또는 우측 Detail Grid에서 선택한 row를 수정한다. Master와 Detail은 같은 table row 구조를 쓰므로 수정 API도 공통이다. Detail 수정 시 `upperCd`는 기존 부모 Master 연결을 유지한다.

입력파라미터:

- path `specId`: 수정 대상 row의 `specId`
- request body: 변경할 SpecMaster row 필드

입력샘플:

```json
{
  "specNm": "M14 Litho Track Rev.2",
  "fabId": "M14",
  "setModelNm": "LITHO-Track-4",
  "modelSpecUseYn": "0",
  "srcGbnCd": "U",
  "detSearYn": "N",
  "mgmtTgtYn": "Y",
  "specMinVal": 37,
  "specMaxVal": 91,
  "chgrEmpno": "100310",
  "chgrNm": "S. Choi",
  "specDesc": "Updated from SpecMaster popup",
  "chgChgrEmpno": "100310"
}
```

출력값샘플:

```json
{
  "specId": "SPEC-M14-LITHO-A",
  "specNm": "M14 Litho Track Rev.2",
  "fabId": "M14",
  "setModelNm": "LITHO-Track-4",
  "upperCd": "",
  "mgmtTgtYn": "Y",
  "specMinVal": 37,
  "specMaxVal": 91,
  "chgrEmpno": "100310",
  "chgrNm": "S. Choi",
  "specDesc": "Updated from SpecMaster popup",
  "chgDtNm": "2026-06-21T13:37:05.259132200+09:00",
  "chgChgrEmpno": "100310"
}
```

## 7. Master/Detail 삭제

METHOD: `DELETE`

API Name(URL): `/api/vc/specmaster/{specId}`

기능설명: 선택한 Master 또는 Detail row를 삭제한다. 현재 preview B/E 정책에서는 Master를 삭제하면 해당 Master의 하위 Detail row도 함께 삭제한다. Detail을 삭제하면 해당 Detail row만 삭제한다.

입력파라미터:

- path `specId`: 삭제 대상 row의 `specId`

입력샘플:

```txt
DELETE /api/vc/specmaster/SPEC-M14-LITHO-A-CH10
```

출력값샘플:

```json
{
  "deletedCount": 1
}
```

## 8. 정확 일치 Spec 조회

METHOD: `POST`

API Name(URL): `/api/vc/specmaster/selectexact`

기능설명: FAB, MODEL, 공정대분류, 공정중분류, CHAMBER SPEC이 정확히 일치하는 Spec row를 조회한다. 현재 좌측/우측 grid의 기본 조회용 API는 아니며, 저장 전 중복 확인이나 V/C 판정 보조처럼 정확 일치가 필요한 흐름에 사용하는 보조 API다.

입력파라미터:

- `fabId`
- `setModelNm`
- `operLargeCatgVal`
- `operMidCatgVal`
- `chambModelNm`

입력샘플:

```json
{
  "fabId": "M14",
  "setModelNm": "LITHO-Track-4",
  "operLargeCatgVal": "LITHO",
  "operMidCatgVal": "Developer",
  "chambModelNm": "LITHO-DEV-03"
}
```

출력값샘플:

```json
[
  {
    "specId": "SPEC-M14-LITHO-A-CH03",
    "specNm": "M14 Litho Develop Chamber",
    "fabId": "M14",
    "setModelNm": "LITHO-Track-4",
    "operLargeCatgVal": "LITHO",
    "operMidCatgVal": "Developer",
    "chambModelNm": "LITHO-DEV-03",
    "upperCd": "SPEC-M14-LITHO-A",
    "specMinVal": 41,
    "specMaxVal": 89,
    "chgrNm": "Y. Han"
  }
]
```

## Current F/E Flow

1. 화면 진입 시 F/E는 FAB 공통코드, SpecMaster 필터 옵션, `/search`를 호출한다.
2. `/search` 응답의 `rows/content`는 좌측 Master Grid 원천 데이터가 된다.
3. `/search` 응답의 `details`는 선택 Master의 우측 Detail Grid 원천 데이터가 된다.
4. 좌측/우측 Grid 헤더 필터는 F/E에서 처리하며, 필터 결과 기준으로 F/E 페이지를 다시 계산한다.
5. Detail 저장 후 F/E는 부모 Master `selectedSpecId`와 저장된 Detail `selectedDetailSpecId`를 넣어 `/search`를 다시 호출한다.
6. 이 재조회 결과로 팝업이 닫힌 뒤에도 좌측 Master radio 선택과 우측 Detail Grid 최신 데이터가 유지된다.

## Removed / Not Used As Screen Contract

- `GET /api/vc/specmaster/selectpaging`
- `POST /api/vc/specmaster/selectpaging`
- `GET /api/vc/specmaster/selectleftpaging`
- `GET /api/vc/specmaster/selectcondition`
- `GET /api/vc/specmaster/{specId}/children`
- 조회 목적의 `POST /api/vc/specmaster/{specId}/children`

위 API들은 현재 프로그램의 SpecMaster 화면 계약이 아니다. grid 조회는 `POST /api/vc/specmaster/search`, Detail 생성은 `POST /api/vc/specmaster/{specId}/children`로 구분한다.
