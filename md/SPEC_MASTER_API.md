# SPEC Master API

이 문서는 `V/C Administration > Spec Master` 화면에서 F/E가 호출하는 API만 정리한다.
Simulation API는 [SIM_API.md](./SIM_API.md)를 기준으로 본다.

## 기준

| 항목 | 내용 |
| --- | --- |
| 기준 화면 | `src/components/vc/admin/SpecMaster.js` |
| F/E API adapter | `src/service/api/vc/admin/specMasterApi.js` |
| B/E Controller | `vcBePrj/src/main/java/com/example/vcbeprj/controller/VcSpecMasterController.java` |
| Mock table | `VCW_VC_SPEC_MST` |

## 화면 데이터 구조

`VCW_VC_SPEC_MST`는 Master와 Detail을 같은 row 구조로 저장한다.

| 구분 | 판별 기준 | 화면 위치 |
| --- | --- | --- |
| Master row | `upperCd`가 비어 있음 | 좌측 Master Grid |
| Detail row | `upperCd`가 부모 Master `specId` | 우측 Detail Grid |

## API 목록

| 순서 | Method | URL | 설명 |
| --- | --- | --- | --- |
| 1 | GET | `/api/commcode/comm-code-list?mstCd=VC_FAB_ID&sysId=VC` | FAB 공통코드 조회 |
| 2 | GET | `/api/vc/specmaster/selectfilteroptions` | 필터/팝업 콤보 후보 조회 |
| 3 | POST | `/api/vc/specmaster/search` | Master Grid 조회와 초기 Detail 조회 |
| 4 | GET | `/api/vc/specmaster/{specId}/children` | 선택 Master의 Detail Grid 조회 |
| 5 | POST | `/api/vc/specmaster` | Master 신규 등록 |
| 6 | POST | `/api/vc/specmaster/{specId}/children` | Detail 신규 등록 |
| 7 | PATCH | `/api/vc/specmaster/{specId}` | Master/Detail 수정 |
| 8 | DELETE | `/api/vc/specmaster/{specId}` | Master/Detail 삭제 |
| 9 | POST | `/api/vc/specmaster/selectexact` | [F/E 미사용 - 보류] 정확 일치 Spec 조회 |

## 1. FAB 공통코드 조회

SpecMaster Search Conditions와 팝업 FAB 콤보에 사용할 FAB 목록을 조회한다. FAB는 SpecMaster table에서 임의 추출하지 않고 회사 공통코드 API를 우선 사용한다.

### Request

```http
GET /api/commcode/comm-code-list?mstCd=VC_FAB_ID&sysId=VC
```

### Request Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `mstCd` | string | Y | `VC_FAB_ID` |
| `sysId` | string | Y | `VC` |

### Response

```json
[
  {
    "mstCd": "VC_FAB_ID",
    "sysId": "VC",
    "commonCd": "M16",
    "commonCdKoNm": "M16",
    "commonCdEnNm": "M16",
    "useYn": "Y"
  }
]
```

### Response Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `commonCd` | string | Y | FAB 코드 |
| `commonCdKoNm`, `commonCdEnNm` | string | N | FAB 표시명 |
| `useYn` | string | N | 사용 여부 |

## 2. 필터 옵션 조회

Search Conditions와 Master/Detail 팝업에서 사용하는 MODEL, 모델관리기준, 공정, CHAMBER SPEC 후보를 조회한다. Grid row 조회용 API가 아니라 콤보 초기화용이다.

### Request

```http
GET /api/vc/specmaster/selectfilteroptions
```

### Request Field

없음.

### Response

```json
{
  "fabIds": ["M12", "M13", "M14", "M15", "M16"],
  "areas": [],
  "makers": [],
  "setModelNms": ["DRY-Etch-10", "LITHO-Track-4"],
  "specNms": ["M13 Dry Etch Standard", "M14 Litho Track"],
  "operLargeCatgVals": ["ETCH", "LITHO"],
  "operMidCatgVals": ["Coater", "Developer"],
  "chambModelNms": ["DRY-STD-A", "LITHO-DEV-03"],
  "rows": []
}
```

### Response Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `fabIds` | array | N | 보조 FAB 후보. 실제 FAB 콤보 원천은 공통코드 API |
| `areas`, `makers` | array | N | 수기등록 후보값 |
| `setModelNms` | array | Y | MODEL 후보 |
| `specNms` | array | Y | 모델관리기준 후보 |
| `operLargeCatgVals` | array | Y | 공정대분류 후보 |
| `operMidCatgVals` | array | Y | 공정중분류 후보 |
| `chambModelNms` | array | Y | CHAMBER SPEC 후보 |
| `rows` | array | N | legacy 호환용 row 목록 |

## 3. Master Grid 조회

좌측 Master Grid를 조회한다. 최초 진입이나 Search Conditions 변경처럼 Master 목록 자체가 바뀔 때 사용한다. 응답에는 초기 선택 Master의 Detail도 함께 담긴다.

라디오 선택만 바뀌는 경우에는 이 API를 다시 호출하지 않고 `GET /api/vc/specmaster/{specId}/children`으로 Detail만 조회한다.

### Request

```http
POST /api/vc/specmaster/search
Content-Type: application/json
```

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

### Request Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `page` | number | Y | B/E 조회 page. 현재 F/E는 내부 필터/페이징을 위해 `0` 사용 |
| `size` | number | Y | B/E 조회 size. 현재 F/E는 충분한 후보를 받기 위해 크게 조회 |
| `fabId` | string | N | Search Conditions FAB |
| `setModelNm` | string | N | Search Conditions MODEL |
| `specNm` | string | N | Search Conditions 모델관리기준 |
| `selectedSpecId` | string | N | 응답에 함께 담을 Detail의 부모 Master |
| `selectedDetailSpecId` | string | N | 저장 후 Detail radio 선택 복구용 |

### Response

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
  "page": 0,
  "size": 500,
  "totalPages": 1,
  "totalElements": 1,
  "selectedSpecId": "SPEC-M14-LITHO-A",
  "selectedDetailSpecId": "SPEC-M14-LITHO-A-CH03",
  "details": [
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
}
```

### Response Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `rows` | array | Y | Master Grid row 목록. `upperCd`가 빈 row |
| `page`, `size` | number | Y | B/E paging 정보 |
| `totalPages`, `totalElements` | number | Y | 전체 건수 정보 |
| `selectedSpecId` | string | N | B/E가 확정한 선택 Master |
| `selectedDetailSpecId` | string | N | B/E가 확정한 선택 Detail |
| `details` | array | Y | 초기 선택 Master의 Detail row 목록 |

## 4. Detail Grid 조회

좌측 Master Grid radio 선택이 바뀔 때 우측 Detail Grid만 조회한다. Master 목록은 이미 화면에 있으므로 `/search`를 다시 호출하지 않는다.

### Request

```http
GET /api/vc/specmaster/SPEC-M14-LITHO-A/children
```

### Request Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| path `specId` | string | Y | 부모 Master `specId` |

### Response

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

### Response Field

Detail row array. 공통 Spec row 필드는 아래 `공통 Spec row field`를 따른다.

## 5. Master 신규 등록

좌측 Master Grid에 들어갈 상위 Spec row를 생성한다. Master row이므로 `upperCd`는 빈 값으로 저장된다.

### Request

```http
POST /api/vc/specmaster
Content-Type: application/json
```

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

### Request Field

공통 Spec row 필드를 사용한다. Master 등록 시 `upperCd`, `operLargeCatgVal`, `operMidCatgVal`, `chambModelNm`은 보통 비워 둔다.

### Response

```json
{
  "specId": "SPEC-4f7b9144-642a-406a-b9b5-aa2b1195fa95",
  "specNm": "M13 Dry Etch Standard",
  "fabId": "M13",
  "setModelNm": "DRY-Etch-10",
  "upperCd": "",
  "specMinVal": 31,
  "specMaxVal": 73,
  "chgrNm": "B. Kang"
}
```

### Response Field

저장된 Master row. 공통 Spec row 필드를 따른다.

## 6. Detail 신규 등록

우측 Detail Grid에 들어갈 하위 Spec row를 생성한다. path의 `{specId}`는 부모 Master이고, 저장되는 Detail row의 `upperCd`가 된다.

### Request

```http
POST /api/vc/specmaster/SPEC-M14-LITHO-A/children
Content-Type: application/json
```

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

### Request Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| path `specId` | string | Y | 부모 Master `specId` |
| body | object | Y | Detail row field. 공통 Spec row 필드 사용 |

### Response

```json
{
  "specId": "SPEC-649ff11f-0bca-4d3b-8800-5b25379ce5d6",
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
```

### Response Field

저장된 Detail row. 공통 Spec row 필드를 따른다.

## 7. Master/Detail 수정

선택한 Master 또는 Detail row를 수정한다. 두 row는 같은 table 구조를 사용하므로 수정 API도 공통이다.

### Request

```http
PATCH /api/vc/specmaster/SPEC-M14-LITHO-A
Content-Type: application/json
```

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

### Request Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| path `specId` | string | Y | 수정 대상 row `specId` |
| body | object | Y | 변경할 Spec row field |

### Response

```json
{
  "specId": "SPEC-M14-LITHO-A",
  "specNm": "M14 Litho Track Rev.2",
  "fabId": "M14",
  "setModelNm": "LITHO-Track-4",
  "upperCd": "",
  "specMinVal": 37,
  "specMaxVal": 91,
  "chgrNm": "S. Choi"
}
```

### Response Field

수정된 row. 공통 Spec row 필드를 따른다.

## 8. Master/Detail 삭제

선택한 Master 또는 Detail row를 삭제한다. 현재 preview B/E는 Master 삭제 시 하위 Detail row도 함께 삭제한다.

### Request

```http
DELETE /api/vc/specmaster/SPEC-M14-LITHO-A-CH10
```

### Request Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| path `specId` | string | Y | 삭제 대상 row `specId` |

### Response

```json
{
  "deletedCount": 1
}
```

### Response Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `deletedCount` | number | Y | 삭제된 row 수 |

## 9. 정확 일치 Spec 조회

> [F/E 미사용 - 보류 API]
> 현재 `src/service/api/vc/admin/specMasterApi.js`와 SpecMaster saga에는 호출 함수가 없다.
> 저장 전 중복 확인 UX가 생기면 연결 후보가 될 수 있다.

FAB, MODEL, 공정대분류, 공정중분류, CHAMBER SPEC이 정확히 일치하는 Spec row를 조회한다. 지금 화면의 grid 조회는 `/search`와 `GET /children`로 충분하므로 이 API는 보류 상태다.

### Request

```http
POST /api/vc/specmaster/selectexact
Content-Type: application/json
```

```json
{
  "fabId": "M14",
  "setModelNm": "LITHO-Track-4",
  "operLargeCatgVal": "LITHO",
  "operMidCatgVal": "Developer",
  "chambModelNm": "LITHO-DEV-03"
}
```

### Request Field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `fabId` | string | Y | FAB 코드 |
| `setModelNm` | string | Y | MODEL |
| `operLargeCatgVal` | string | Y | 공정대분류 |
| `operMidCatgVal` | string | Y | 공정중분류 |
| `chambModelNm` | string | Y | CHAMBER SPEC |

### Response

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

### Response Field

정확히 일치하는 Spec row array. 공통 Spec row 필드를 따른다.

## 공통 Spec row field

| Field | Type | 필수 | 설명 |
| --- | --- | --- | --- |
| `specId` | string | 응답 Y | Spec row PK |
| `specNm` | string | Y | 모델관리기준명 또는 Spec 이름 |
| `fabId` | string | Y | FAB 코드 |
| `setModelNm` | string | N | 장비 Set Model |
| `operLargeCatgVal` | string | Detail Y | 공정대분류 |
| `operMidCatgVal` | string | Detail Y | 공정중분류 |
| `chambModelNm` | string | Detail Y | Chamber Spec |
| `modelSpecUseYn` | string | N | 모델 Spec 사용 여부. 보통 `0` |
| `srcGbnCd` | string | N | 출처 구분. 수기 등록은 보통 `U` |
| `detSearYn` | string | N | 상세스펙 유무 `Y/N` |
| `upperCd` | string | 조건부 | Detail이면 부모 Master `specId`, Master이면 빈 값 |
| `mgmtTgtYn` | string | N | 사용 여부 `Y/N` |
| `specMinVal` | number/string | N | V/C 최소 기준 |
| `specMaxVal` | number/string | N | V/C 최대 기준 |
| `chgrEmpno` | string | N | 담당자 사번 |
| `chgrNm` | string | N | 담당자 이름 |
| `specDesc` | string | N | 설명 |
| `regEmpno` | string | N | 등록자 사번 |
| `chgChgrEmpno` | string | N | 변경자 사번 |

## 현재 F/E 흐름

1. 화면 진입 시 FAB 공통코드, 필터 옵션, `/search`를 호출한다.
2. `/search` 응답의 `rows`는 좌측 Master Grid가 된다.
3. `/search` 응답의 `details`는 초기 선택 Master의 우측 Detail Grid가 된다.
4. Master radio 선택이 바뀌면 `/search`를 다시 호출하지 않고 `GET /api/vc/specmaster/{specId}/children`만 호출한다.
5. 저장/삭제 후에는 `/search`를 다시 호출해 Master 선택과 Detail 최신 데이터를 맞춘다.

## Removed / Not Used As Screen Contract

아래 API들은 현재 SpecMaster 화면 계약이 아니다.

| Method | URL | 현재 대체 API |
| --- | --- | --- |
| GET | `/api/vc/specmaster/selectpaging` | `POST /api/vc/specmaster/search` |
| POST | `/api/vc/specmaster/selectpaging` | `POST /api/vc/specmaster/search` |
| GET | `/api/vc/specmaster/selectleftpaging` | `POST /api/vc/specmaster/search` |
| GET | `/api/vc/specmaster/selectcondition` | `GET /api/vc/specmaster/selectfilteroptions` |
| POST | `/api/vc/specmaster/{specId}/children` 조회 목적 | 조회는 `GET /api/vc/specmaster/{specId}/children`, 생성은 `POST /api/vc/specmaster/{specId}/children` |

## F/E 미사용 / 보류 API 조사

아래 API들은 2026-06-22 기준으로 B/E에는 열려 있지만 현재 F/E 화면 어댑터와 saga에서 직접 호출하지 않는다.

| 구분 | Method | URL | 이유 |
| --- | --- | --- | --- |
| [F/E 미사용 - 보류] | POST | `/api/vc/specmaster/selectexact` | 저장 전 중복 확인 UX가 아직 없다. 같은 FAB/MODEL/공정/CHAMBER SPEC 조합을 저장 전에 막아야 하면 연결 후보다. |

참고: `GET /api/vc/specs`는 완전 미사용이 아니다. `GET /api/vc/specmaster/selectfilteroptions` 실패 시 `src/service/api/vc/admin/specMasterApi.js`의 legacy fallback으로 호출될 수 있다.
