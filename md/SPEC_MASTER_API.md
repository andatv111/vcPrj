# SPEC Master API

구분: SPEC 마스터  
테스트: B/E  
기준 F/E: `src/components/vc/admin/spec/SpecMgmt.js`
기준 API adapter: `src/service/api/vc/admin/specApi.js`
기준 saga: `src/saga/vc/admin/specSaga.js`

## GoodDocs 기준 API

| 순서 | METHOD | API Name(URL) | 기능설명 | 입력파라미터 |
| --- | --- | --- | --- | --- |
| 1 | POST | `/api/vc/specmaster` | SPEC마스터데이터추가 | `specNm`, `fabId`, `setModelNm`, `operLargeCatgVal`, `operMidCatgVal`, `srcGbnCd`, `detSearYn`, `chgrEmpno`, `chgrNm`, `specDesc`, `regEmpno` |
| 2 | GET | `/api/vc/specmaster/{specId}` | specId와 일치하는 데이터 조회 | path `specId` |
| 3 | PATCH | `/api/vc/specmaster/{specId}` | specId와 일치하는 데이터 변경 | path `specId`, body 변경 필드 |
| 4 | DELETE | `/api/vc/specmaster/{specId}?chgchgrempno=` | specId와 일치하는 데이터삭제 | path `specId`, query `chgchgrempno` |
| 5 | POST | `/api/vc/specmaster/{specId}/children` | 마스터그리드에서 선택한 데이터의 상세정보등록 | path 부모 `specId`, body Detail 필드 |
| 6 | GET | `/api/vc/specmaster/{specId}/children` | 상위 스펙 ID와 일치하는 상세스펙조회 | path 부모 `specId` |
| 7 | POST | `/api/vc/specmaster/selectcondition` | 조회조건에 맞는 Master/Detail 전체 조회 | `tabId`, `fabId`, `setModelNm`, `specNm` |

GoodDocs 초안의 `selectcondition` 표기는 GET/query였지만 현재 개발 기준은 POST body 방식이다.

## Combo API

GoodDocs 표에는 없지만 화면 상단 조회조건 콤보와 저장 팝업 콤보는 서로 다른 state/API로 분리한다.

| METHOD | API Name(URL) | 기능설명 | 사용처 |
| --- | --- | --- | --- |
| GET | `/api/vc/code/getFabOptions` | 검색조건 FAB 후보 조회 | Search Conditions 최초 진입 |
| GET | `/api/vc/code/getSpecMModelOptions?fabId={fabId}` | 선택 FAB의 MODEL 후보 조회 | Search Conditions FAB 변경 |
| GET | `/api/vc/code/getMSpecNMs?fabId={fabId}&specNm={specNm}` | 선택 FAB 안에서 Spec Name 포함 검색 | Search Conditions Spec Name 입력 |
| GET | `/api/vc/specmaster/selectfilteroptions` | AREA/MAKER/공정 등 팝업 후보 조회 | Master/Detail popup open |

검색조건은 `searchOptions.fabIds`, `searchOptions.setModelNms`를 사용하고 팝업은 기존 `options`를 사용한다. `getMSpecNMs`의 query 이름은 `keyword`가 아니라 반드시 `fabId`, `specNm`이다. `selectfilteroptions`는 팝업을 열 때만 조회하며 `areasByFab`, `makersByArea`, `modelsByFab`, `modelsByMaker`, `operMidByLarge`로 종속 콤보를 구성한다.

현재 `VCW_VC_SPEC_MST` mock table에는 AREA/MAKER 컬럼이 없어 `areas`, `makers`는 빈 배열로 내려간다. 운영 DB 컬럼이 확정되면 같은 response key에 값을 채우면 된다.

Response sample:

```json
{
  "fabIds": ["M14", "M15", "M16"],
  "areas": [],
  "makers": [],
  "setModelNms": ["LITHO-Track-4", "VX-ETCH-300"],
  "specNms": ["M14 Litho Track", "M16 ETCH Clean Chamber"],
  "operLargeCatgVals": ["LITHO", "ETCH"],
  "operMidCatgVals": ["Developer", "Clean"],
  "chambModelNms": ["LITHO-DEV-03", "ETCH-LINE-S"]
}
```

## Current F/E Flow

1. 화면 진입 시 `GET /api/vc/code/getFabOptions`와 `POST /api/vc/specmaster/selectcondition`을 병렬 호출한다.
2. `selectcondition`의 `rows`, `details`를 저장하고 Master radio 변경은 F/E state 안에서 처리한다.
3. FAB 선택 시에만 `getSpecMModelOptions?fabId=...`를 호출하고, FAB 변경 시 MODEL/Spec Name을 비운다.
4. FAB와 Spec Name이 모두 있을 때만 `getMSpecNMs?fabId=...&specNm=...`를 호출한다.
5. 신규/수정 팝업을 열 때 `selectfilteroptions`로 팝업 전용 후보를 조회한다.
6. 수정 팝업은 grid row로 먼저 열고 `GET /api/vc/specmaster/{specId}` 결과로 form을 다시 보정한다.
7. 저장/삭제 후 전체 목록을 재조회하고 대상 Master/Detail ID가 속한 10행 단위 페이지로 이동해 radio를 자동 선택한다.

## 1. Master/Detail 조회

METHOD: `POST`  
API Name(URL): `/api/vc/specmaster/selectcondition`

Request:

```json
{
  "tabId": "SPEC_MASTER",
  "fabId": "M14",
  "setModelNm": "LITHO-Track-4",
  "specNm": "Litho"
}
```

Response:

```json
{
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
  "details": [
    {
      "specId": "SPEC-M14-LITHO-A-CH01",
      "upperCd": "SPEC-M14-LITHO-A",
      "specNm": "M14 Litho Chamber"
    }
  ]
}
```

## 2. 단건 조회

METHOD: `GET`  
API Name(URL): `/api/vc/specmaster/{specId}`

수정 팝업을 열 때 상세 정보 한 건을 다시 확인한다.

```txt
GET /api/vc/specmaster/SPEC-M14-LITHO-A
```

## 3. Master 신규 등록

METHOD: `POST`  
API Name(URL): `/api/vc/specmaster`

```json
{
  "specNm": "M13 Dry Etch Standard",
  "fabId": "M13",
  "setModelNm": "DRY-Etch-10",
  "srcGbnCd": "U",
  "detSearYn": "N",
  "specMinVal": 31,
  "specMaxVal": 73,
  "chgrEmpno": "100410",
  "chgrNm": "B. Kang",
  "specDesc": "Created from Spec Master popup",
  "regEmpno": "100410"
}
```

## 4. Detail 신규 등록

METHOD: `POST`  
API Name(URL): `/api/vc/specmaster/{specId}/children`

path의 `{specId}`는 부모 Master의 specId다.

```json
{
  "fabId": "M14",
  "setModelNm": "LITHO-Track-4",
  "specNm": "M14 Litho Develop Chamber",
  "chambModelNm": "LITHO-DEV-03",
  "modelSpecUseYn": "0",
  "specMinVal": 41,
  "specMaxVal": 89,
  "chgrEmpno": "100312",
  "chgrNm": "Y. Han",
  "specDesc": "Created from Detail popup",
  "regEmpno": "100312"
}
```

## 5. Detail 조회

METHOD: `GET`  
API Name(URL): `/api/vc/specmaster/{specId}/children`

```txt
GET /api/vc/specmaster/SPEC-M14-LITHO-A/children
```

## 6. Master/Detail 수정

METHOD: `PATCH`  
API Name(URL): `/api/vc/specmaster/{specId}`

```json
{
  "specNm": "M14 Litho Track Rev.2",
  "modelSpecUseYn": "0",
  "srcGbnCd": "U",
  "detSearYn": "N",
  "specMinVal": 37,
  "specMaxVal": 91,
  "chgrEmpno": "100310",
  "chgrNm": "S. Choi",
  "specDesc": "Updated from Spec popup",
  "chgChgrEmpno": "100310"
}
```

## 7. Master/Detail 삭제

METHOD: `DELETE`  
API Name(URL): `/api/vc/specmaster/{specId}?chgchgrempno=`

```txt
DELETE /api/vc/specmaster/SPEC-M14-LITHO-A-CH10?chgchgrempno=100310
```

## 사용하지 않는 API

| API | 구분 | 이유 |
| --- | --- | --- |
| `POST /api/vc/specmaster/search` | 미사용 | GoodDocs 기준 `POST /selectcondition`으로 변경 |
| `GET /api/vc/specmaster/selectpaging` | 미사용 | B/E 전체 데이터 반환 후 F/E paging 처리 |
| `POST /api/vc/specmaster/selectpaging` | 미사용 | B/E 전체 데이터 반환 후 F/E paging 처리 |
| `GET /api/vc/specmaster/selectleftpaging` | 미사용 | B/E 전체 데이터 반환 후 F/E paging 처리 |
