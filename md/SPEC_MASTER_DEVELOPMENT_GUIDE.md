# Spec Master 개발 가이드

이 문서는 `V/C Administration > Spec Master` 화면을 처음 보는 초급 개발자와 B/E 개발자가 같은 기준으로 대화할 수 있게 정리한 문서다.

핵심 목적은 세 가지다.

- 화면에서 어떤 API가 실제로 필요한지 설명한다.
- 최초 GoodDocs API가 화면 어디에 쓰이는지, 또는 왜 현재 화면에서는 직접 쓰지 않는지 설명한다.
- B/E 개발자에게 “이 API는 왜 만들었나요?”, “이건 중복 아닌가요?”, “이 화면에서 어디에 쓰나요?”를 질문할 때 기준을 제공한다.

## 파일 구조

| 역할 | 파일 |
| --- | --- |
| 화면 | `src/components/vc/admin/SpecMaster.js` |
| Redux action | `src/store/vc/specMaster/action.js` |
| Redux reducer | `src/store/vc/specMaster/reducer.js` |
| Redux selector | `src/store/vc/specMaster/vcSpecMasterSelector.js` |
| Saga | `src/saga/vc/admin/specMasterSaga.js` |
| F/E API adapter | `src/service/api/vc/admin/specMasterApi.js` |
| B/E Controller | `vcBePrj/src/main/java/com/example/vcbeprj/controller/VcSpecMasterController.java` |
| B/E Service | `vcBePrj/src/main/java/com/example/vcbeprj/service/VcSpecMasterService.java` |
| FAB 공통코드 API | `vcBePrj/src/main/java/com/example/vcbeprj/controller/CommonCodeController.java` |
| mock DB | `vcBePrj/data/VCW_VC_SPEC_MST.txt` |

## 화면 구성

Spec Master 화면은 세 영역으로 나뉜다.

| 영역 | 설명 |
| --- | --- |
| Search Conditions | FAB, MODEL, 모델관리기준 조건으로 좌측 Master Grid를 조회한다. |
| Master Grid | 상위 Spec 목록이다. 행을 선택하면 오른쪽 Detail Grid를 조회한다. |
| Detail Grid | 선택한 Master의 하위 상세 Spec 목록이다. Excel 버튼은 선택 Master 1건과 Detail 전체를 서로 다른 표로 내려받는다. |

등록/수정 팝업은 하나를 재사용한다.

| 팝업 구분 | 설명 |
| --- | --- |
| Master 팝업 | Master Grid의 신규/수정 버튼에서 열린다. 공정대분류, 공정중분류, CHAMBER SPEC은 보이지 않는다. |
| Detail 팝업 | Detail Grid의 신규/수정 버튼에서 열린다. 공정대분류, 공정중분류, CHAMBER SPEC이 보인다. 상세스펙 유무와 수기등록 스위치는 보이지 않는다. |

## 화면 데이터 기준

`VCW_VC_SPEC_MST` 한 테이블에서 Master와 Detail을 같이 관리한다.

| 구분 | 판정 기준 |
| --- | --- |
| Master | `upperCd`가 빈 값인 row |
| Detail | `upperCd`가 상위 Master의 `specId`인 row |

화면에서는 좌측 Master를 선택하면 그 Master의 `specId`를 기준으로 `upperCd == specId`인 Detail을 조회한다.

## F/E 화면 흐름

1. 화면 진입 시 `initRequest()`가 콤보 데이터를 조회한다.
2. FAB 콤보는 회사 공통코드 API인 `/api/commcode/comm-code-list?mstCd=VC_FAB_ID&sysId=VC`에서 가져온다.
3. MODEL, 모델관리기준, 공정, CHAMBER SPEC 후보는 `/api/vc/specmaster/selectfilteroptions`에서 가져온다.
4. `searchRequest()`가 좌측 Master Grid를 조회한다.
5. 첫 번째 Master가 있으면 자동으로 Detail Grid를 조회한다.
6. 사용자가 Master radio를 선택하면 선택 Master 기준으로 Detail Grid를 다시 조회한다.
7. 신규/수정/삭제 버튼은 Master와 Detail 모두 같은 SpecMaster table row를 대상으로 처리한다.

## 현재 F/E가 실제 사용하는 API

| 화면 기능 | 현재 호출 API | 사용 이유 |
| --- | --- | --- |
| FAB 콤보 | `GET /api/commcode/comm-code-list?mstCd=VC_FAB_ID&sysId=VC` | GoodDocs에 “FAB는 회사 Common API 사용”이라고 되어 있으므로 FAB는 이 API를 원천으로 사용한다. |
| 나머지 콤보 | `GET /api/vc/specmaster/selectfilteroptions` | MODEL, 모델관리기준, 공정대분류, 공정중분류, CHAMBER SPEC 후보를 한 번에 받기 위한 화면 초기화 API다. |
| 좌측 Master 조회 | `GET /api/vc/specmaster/selectleftpaging?page=0&size=10&fabId=&setModelNm=&specNm=` | Master Grid 전용 조회다. `upperCd`가 빈 상위 Spec만 조회해야 하므로 가장 화면 사상에 맞다. |
| 우측 Detail 조회 | `GET /api/vc/specmaster/{specId}/children` | 선택 Master의 하위 Detail만 조회한다. |
| Master 신규 | `POST /api/vc/specmaster` | Master 팝업 저장. |
| Detail 신규 | `POST /api/vc/specmaster/{specId}/children` | 선택 Master 아래 Detail 팝업 저장. |
| Master/Detail 수정 | `PATCH /api/vc/specmaster/{specId}` | Master와 Detail 모두 같은 table row이므로 수정 API를 공통 사용한다. |
| Master/Detail 삭제 | `DELETE /api/vc/specmaster/{specId}?chgchgrempno=` | Master와 Detail 모두 같은 table row이므로 삭제 API를 공통 사용한다. Master 삭제 시 하위 Detail도 같이 삭제하는 정책이 필요하다. |
| 단건 조회 | `GET /api/vc/specmaster/{specId}` | 현재 화면은 선택 row 데이터를 이미 들고 있어 필수는 아니다. 다만 수정 팝업을 열 때 최신 DB 값을 다시 읽어야 한다면 사용할 수 있다. |

## GoodDocs 최초 API별 판단

아래 표는 최초 GoodDocs에 있던 API를 화면 기준으로 다시 해석한 것이다. “사용”은 현재 F/E에서 직접 호출하는 API이고, “보류”는 B/E에는 있어도 되지만 현재 화면 흐름에는 직접 필요하지 않은 API다.

| No | GoodDocs API | GoodDocs 의도 | 현재 판단 | 화면 위치 | B/E와 이야기할 포인트 |
| --- | --- | --- | --- | --- | --- |
| 1 | `POST /api/vc/specmaster` | SPEC 마스터 데이터 추가 | 사용 | Master 신규 팝업 저장 | Master row 생성용이다. Detail 생성과는 분리해서 쓴다. |
| 2 | `GET /api/vc/specmaster/selectpaging?page=0&size=10` | 전체 데이터 페이징 조회 | 보류 | 현재 직접 사용 안 함 | Master와 Detail이 섞여 내려올 가능성이 있다. 화면 좌측은 Master만 필요하므로 `selectleftpaging`이 더 적합하다. 관리/디버그용 전체 조회라면 유지 가능하다. |
| 3 | `GET /api/vc/specmaster/{specId}` | specId 단건 조회 | 선택 사용 | 수정 팝업 보강용 | 현재 F/E는 grid row를 그대로 팝업에 넣는다. DB 최신값을 보장해야 하면 팝업 열 때 이 API를 추가 호출하면 된다. |
| 4 | `POST /api/vc/specmaster/selectpaging` | 조건에 맞는 전체 데이터 페이징 조회 | 보류 | 현재 직접 사용 안 함 | 조건이 `fabId`, `setModelNm`, `operLargeCatgVal`, `operMidCatgVal`, `chambModelNm`라서 Detail 성격이 강하다. Master Grid 검색 조건과 다르다. |
| 5 | `POST /api/vc/specmaster/selectexact` | FAB, MODEL, 공정, CHAMBER SPEC이 정확히 일치하는 row 조회 | 보류 | 중복 체크 또는 Spec 판정 보조 | 신규 저장 전 중복 체크, Calculator/판정 로직에서 정확히 맞는 Spec 찾기에는 유용할 수 있다. 현재 SpecMaster 화면의 기본 조회에는 쓰지 않는다. |
| 6 | `PATCH /api/vc/specmaster/{specId}` | specId row 변경 | 사용 | Master/Detail 수정 팝업 저장 | Master와 Detail 모두 같은 테이블 row라 공통 수정 API가 맞다. |
| 7 | `DELETE /api/vc/specmaster/{specId}?chgchgrempno=` | specId row 삭제 | 사용 | Master/Detail 삭제 버튼 | Detail 삭제는 해당 row만 삭제한다. Master 삭제는 children까지 같이 삭제할지 B/E 정책을 확정해야 한다. 현재 로컬 B/E는 children도 함께 삭제한다. |
| 8 | `POST /api/vc/specmaster/{specId}/children` | 선택 row의 상세 정보 등록 | 사용 | Detail 신규 팝업 저장 | 선택 Master의 `specId`를 path로 보내고, body에는 Detail 입력값을 보낸다. |
| 9 | `GET /api/vc/specmaster/selectleftpaging?page=0&size=10&fabId=&setModelNm=&specNm=` | 상위 Spec만 페이징 조회하여 좌측 테이블 출력 | 사용 | 좌측 Master Grid 조회 | 이 화면의 핵심 조회 API다. `upperCd`가 빈 Master만 내려와야 한다. |
| 10 | `POST /api/vc/specmaster/{specId}/children` | 상위 Spec ID와 일치하는 상세 Spec 조회 | 개선 필요 | 우측 Detail Grid 조회 | No.8과 Method/URL이 같지만 의미가 다르다. 등록과 조회가 같은 `POST /children`이면 F/E가 헷갈린다. 현재 개선안은 조회를 `GET /api/vc/specmaster/{specId}/children`로 분리하는 것이다. |
| 11 | `GET /api/vc/specmaster/selectcondition?fabId=&setModelNm=&specNm=` | 전체 필터 조건 조회 | 보류 | 현재 직접 사용 안 함 | No.9와 비슷하지만 paging 정보가 없다. “조건에 맞는 전체 Master 목록”이 필요할 때 쓸 수 있으나 Grid에는 No.9가 더 적합하다. |
| 12 | `GET /api/vc/specmaster/selectfilteroptions` | 건물/FAB, 모델코드, 모델관리기준 목록 조회 | 부분 사용 | 화면 진입 시 콤보 초기화 | 오타 URL은 수정됐다고 보고 `/api/vc/specmaster/selectfilteroptions`로 사용한다. 단, FAB는 Common API가 원천이므로 여기의 `fabIds`는 보조값으로만 본다. |

## API가 중복처럼 보이는 이유

GoodDocs에는 비슷한 조회 API가 여러 개 있다. 초급 개발자는 아래처럼 구분하면 된다.

| API | 데이터 범위 | 화면 사용 판단 |
| --- | --- | --- |
| `selectleftpaging` | Master만, paging 있음 | 좌측 Master Grid에 가장 적합하다. |
| `selectcondition` | Master 조건 조회로 보이나 paging 없음 | 목록 전체가 필요할 때 보조로 쓸 수 있다. 현재 화면 Grid에는 paging이 있는 `selectleftpaging`을 쓴다. |
| `GET selectpaging` | Master/Detail 전체일 수 있음 | 화면용보다는 관리자/디버그/전체 다운로드 성격이다. |
| `POST selectpaging` | 조건 기반 전체 조회 | Detail 조건까지 포함하므로 현재 좌측 Master 조회에는 맞지 않는다. |
| `selectexact` | 조건이 정확히 일치하는 단건 또는 목록 | 저장 전 중복 체크나 계산 판정용으로 더 어울린다. |
| `children` 조회 | 특정 Master의 Detail만 | 우측 Detail Grid에 필요하다. 조회는 GET으로 분리하는 것이 명확하다. |

## B/E 개발자에게 확인할 질문

아래 질문을 그대로 가져가면 대화가 편하다.

1. `selectleftpaging`은 `upperCd`가 빈 Master row만 내려주는 API가 맞나요?
2. `POST /{specId}/children`은 Detail 등록용이고, Detail 조회는 `GET /{specId}/children`로 분리해도 되나요?
3. Master 삭제 시 하위 Detail row도 같이 삭제하는 정책이 맞나요, 아니면 Detail이 있으면 삭제를 막아야 하나요?
4. `selectexact`는 화면 조회용인가요, 아니면 저장 전 중복 체크나 V/C 판정용인가요?
5. `selectcondition`과 `selectleftpaging`의 차이는 paging 유무뿐인가요, 아니면 조회 대상이 다르나요?
6. `selectfilteroptions`에서 FAB도 주지만, GoodDocs에는 FAB를 Common API로 쓰라고 되어 있습니다. FAB 원천은 Common API가 맞나요?
7. AREA, MAKER, MODEL 콤보는 추후 별도 Common/Equipment API로 분리될 예정인가요, 아니면 `selectfilteroptions`에 계속 포함되나요?

## 화면별 API 사용 상세

### 화면 진입

화면이 처음 열리면 두 API를 호출한다.

| 순서 | API | 목적 |
| --- | --- | --- |
| 1 | `GET /api/commcode/comm-code-list?mstCd=VC_FAB_ID&sysId=VC` | FAB 콤보 구성 |
| 2 | `GET /api/vc/specmaster/selectfilteroptions` | MODEL, 모델관리기준, 공정, CHAMBER SPEC 콤보 구성 |

FAB는 공통코드가 원천이다. `selectfilteroptions`의 `fabIds`는 fallback 또는 보조 데이터로만 본다.

### 조회 버튼

조회 버튼을 누르면 아래 API를 호출한다.

```http
GET /api/vc/specmaster/selectleftpaging?page=0&size=10&fabId={fabId}&setModelNm={setModelNm}&specNm={specNm}
```

이 API는 좌측 Master Grid 전용이다. 응답 row는 Master만 내려와야 한다.

### Master 선택

Master radio를 선택하면 아래 API를 호출한다.

```http
GET /api/vc/specmaster/{specId}/children
```

이 API는 우측 Detail Grid 전용이다. 응답 row는 `upperCd`가 선택 Master의 `specId`와 같은 Detail만 내려와야 한다.

### Master 신규/수정

Master 팝업에는 공정대분류, 공정중분류, CHAMBER SPEC이 없다.

| 동작 | API |
| --- | --- |
| 신규 | `POST /api/vc/specmaster` |
| 수정 | `PATCH /api/vc/specmaster/{specId}` |

상세스펙 유무가 `Y`이면 모델관리기준명, MIN SPEC, MAX SPEC을 비활성화한다.

### Detail 신규/수정

Detail 팝업에는 공정대분류, 공정중분류, CHAMBER SPEC이 있다. 상세스펙 유무와 수기등록 스위치는 보이지 않는다.

| 동작 | API |
| --- | --- |
| 신규 | `POST /api/vc/specmaster/{parentSpecId}/children` |
| 수정 | `PATCH /api/vc/specmaster/{specId}` |

Detail은 항상 어떤 Master 아래에 들어가므로 신규 저장 시 path의 `parentSpecId`가 필수다.

### 삭제

```http
DELETE /api/vc/specmaster/{specId}?chgchgrempno={empNo}
```

Master와 Detail 모두 같은 삭제 API를 쓴다. 다만 Master 삭제 정책은 중요하다.

| 삭제 대상 | 권장 정책 |
| --- | --- |
| Detail | 해당 Detail row만 삭제 |
| Master | 하위 Detail까지 함께 삭제하거나, 하위 Detail이 있으면 삭제를 막는 정책 중 하나를 B/E와 확정 |

현재 로컬 B/E는 Master 삭제 시 children도 함께 삭제한다.

## 요청/응답 형태

Response 샘플이 길거나 확정되지 않았으므로 F/E는 아래 형태를 모두 받아들인다.

- 배열 자체
- `{ data: [...] }`
- `{ content: [...] }`
- `{ rows: [...] }`
- `{ items: [...] }`
- Spring paging 형태 `{ content, number, size, totalPages, totalElements }`

현재 로컬 B/E는 paging 응답에 `content`와 `rows`를 둘 다 넣는다. F/E는 둘 중 어떤 이름이 와도 같은 grid row로 normalize한다.

## mock DB 규칙

`VCW_VC_SPEC_MST.txt`는 JSON Lines 형식이다. 한 줄이 `SpecMaster` 한 건이다.

| 컬럼 | 의미 |
| --- | --- |
| `specId` | Spec row의 PK |
| `specNm` | 모델관리기준명 또는 Spec 이름 |
| `fabId` | FAB 코드 |
| `setModelNm` | 장비 Set Model |
| `operLargeCatgVal` | 공정대분류, Detail에서 사용 |
| `operMidCatgVal` | 공정중분류, Detail에서 사용 |
| `chambModelNm` | Chamber Spec, Detail에서 사용 |
| `detSearYn` | 상세스펙 유무 |
| `upperCd` | 상위 Master의 `specId`; 빈 값이면 Master |
| `mgmtTgtYn` | 사용여부 |
| `specMinVal`, `specMaxVal` | V/C Spec 기준값 |
| `chgrEmpno`, `chgrNm` | 담당자 |

## 퍼블 반영 기준

| class | 의미 |
| --- | --- |
| `searchStyle` | 조회조건 영역 |
| `vcsnofM001Style` | 메인 업무 grid 영역 |
| `vcsnofP001Style` | 팝업 dim/popup 영역 |
| `vc-pub-popup` | 팝업 header/body/footer 분리 |
| `vc-switch-field` | 퍼블 기준 switch UI |
| `buttonArea` | 버튼 묶음 |
| `tableScrollStyle` | grid scroll |

퍼블 CSS가 추가로 오면 기능 코드는 유지하고 위 class의 CSS만 교체하는 방향이 안전하다.

## 확인 명령

```bash
npm run build
npm run test:vc
```

```powershell
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-25.0.3.9-hotspot'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
mvn test
```

로컬 화면은 Vite proxy가 `http://localhost:8090`을 바라본다. STS에서 B/E를 재시작해야 새 SpecMaster API와 mock DB가 화면에 반영된다.
