# V/C Simulation B/E

Spring Boot 3.3, Java 17 기반 V/C Simulation B/E 프로젝트입니다. 현재는 실제 DB 대신 `data/*.txt` JSON Lines 파일을 mock table로 사용합니다. Eclipse/STS에서 F/E와 별도로 실행합니다.

## 실행

1. Eclipse/STS에서 `Existing Maven Projects`로 `vcBePrj`를 import합니다.
2. JDK 17을 설정합니다.
3. `VcBePrjApplication`을 Spring Boot App으로 실행합니다.

| 구분 | 값 |
| --- | --- |
| B/E 포트 | `8090` |
| F/E 개발 서버 | `5173` |
| Controller Base Path | `/api/vc/sim` |
| Mock DB 경로 | `data` |

Maven 검증:

```powershell
mvn clean test
```

## 주요 구조

| 계층 | 파일 | 역할 |
| --- | --- | --- |
| Application | `VcBePrjApplication` | Spring Boot 시작점 |
| Controller | `VcSimController` | F/E 화면 API endpoint |
| Facade | `VcSimFacadeService` | F/E DTO와 계산 서비스 연결 |
| Portal Service | `PortalManualDrawingService` | 도면, EQ, Spec 조회와 다운로드 업무 키 확인 |
| Calculation | `VcCalculationService` | 계산, GUID, 저장 순서와 transaction 경계 |
| Judge | `VcJudgeService` | Spec 판정 |
| Routing | `VcTableRoutingService` | FAB별 M14/M15/M16 table routing |
| Repository | `TxtTableRepository` | TXT mock table SELECT/INSERT/UPDATE/DELETE |
| Logging | `logback-spring.xml`, `StartupLogRunner` | 실행 및 업무 흐름 콘솔 로그 |

## Mock Table

| 파일 | 용도 |
| --- | --- |
| `VC_PORTAL_MANUAL_DRAWING.txt` | 설계포탈 쿼리 확정 전 상단 도면 조회 데이터 |
| `VCW_VC_SPEC_MST.txt` | Model Standard와 Min/Max Spec 기준 |
| `M14_VC_REQ_*.txt` | M14 요청/결과 mock table |
| `M15_VC_REQ_*.txt` | M15 요청/결과 mock table |
| `M16_VC_REQ_*.txt` | M16 요청/결과 mock table |

각 파일은 JSON Lines 형식이며 한 줄이 한 row입니다. 실제 DB 전환 시 Service 계약은 유지하고 `TxtTableRepository`를 MyBatis/JPA adapter로 교체합니다.

## Transaction

`VcCalculationService.calculateVcRequest()`가 transaction 경계입니다. 현재는 TXT mock DB이므로 `MockFileTransactionManager`가 사용됩니다. 실제 DB 적용 시 JDBC/MyBatis transaction manager로 교체합니다.

## API

| Method | URL | 업무 |
| --- | --- | --- |
| GET | `/api/vc/sim/non-bim/options` | Non-BIM FAB/Pipe Type 선택지 조회 |
| GET | `/api/vc/sim/non-bim/equipments` | EQ ID 자동완성 |
| GET | `/api/vc/sim/non-bim/manual-drawings` | BIM/5D 미적용 Fab 상단 그리드 조회 |
| GET | `/api/vc/sim/non-bim/chambers` | 선택 도면의 실제 Chamber명/상세 조회 |
| GET | `/api/vc/sim/non-bim/equipment-spec-options` | 장비 기준 Model Standard/Spec 조회 |
| GET | `/api/vc/sim/non-bim/foreline-drawing/download` | Foreline 도면 다운로드 |
| POST | `/api/vc/sim/non-bim/calculate` | Non-BIM 계산 |
| GET | `/api/vc/sim/calculator/options` | Calculator 초기 옵션 조회 |
| POST | `/api/vc/sim/calculator/calculate` | Calculator 계산 |
| POST | `/api/vc/sim/result/save` | 결과 저장 |

상세 query/body/response와 B/E 구현 요청사항은 저장소 루트의 `README_API.md`를 기준으로 합니다.

## 로그 확인

STS 콘솔에서 다음 태그를 기준으로 흐름을 확인할 수 있습니다.

- `[BOOT]`: 시작 설정과 mock DB 경로
- `[API]`: Controller 요청
- `[SERVICE]`: 화면 및 계산 업무
- `[FLOW]`: 계산 단계와 저장 순서
- `[TABLE_ROUTING]`: FAB별 table 선택
- `[TXT_DB]`: TXT 파일 CRUD와 row count

## 연동 원칙

- F/E는 `vcSimApi.js` 하나만 사용합니다.
- B/E 변경 시 Controller/DTO와 루트 `README_API.md`를 함께 갱신합니다.
- JSON 필드명은 Java record의 camelCase 이름을 F/E 계약명으로 그대로 사용합니다. 레거시 약어 또는 복수 alias를 동시에 지원하지 않습니다.
- DTO 필드명을 변경할 때는 F/E가 임의 alias로 보완하는 방식 대신 Java DTO, F/E 모델, request/response sample을 같은 작업 단위로 변경합니다.
- 첫 번째 그리드 업무 PK는 `constructionNo`입니다.
- 기존 Chamber 탭명은 `VC_PORTAL_MANUAL_DRAWING.txt`의 `chambers[].chamberName`을 반환합니다. `M16_VC_REQ_CHAMBER.txt`의 순번명은 초기 탭명 원천이 아닙니다.
- 다운로드는 `eqId + constructionNo`가 필수이며 `drawingKey`, `fileId`는 보조 키입니다.
- 설계포탈 실제 쿼리 확정 후 `PortalManualDrawingService`의 TXT 조회를 실제 DB adapter로 교체합니다.
- F/E 조회조건/콤보/그리드에 표시되는 업무 데이터는 B/E API가 제공합니다. 화면 위치와 레이아웃은 변경하지 않습니다.
- FAB/MODEL/Model Standard/Pipe Type 같은 선택지는 `{ value, label }` 형식으로 반환합니다.

## 현재 DTO 명명 기준

| 구분 | Java 기준 필드 |
| --- | --- |
| 수기 도면 Chamber 조회 | `chamberId`, `chamberName`, `modelStandard`, `minSpec`, `maxSpec`, `processLarge`, `processMiddle`, `pipeRows` |
| 수기 도면 Pipe row | `pipeType`, `inletDia`, `pipeLength`, `angle`, `outletDia`, `qty` |
| 계산 요청 Chamber | `seq`, `chamberId`, `chamberName`, `calculationTarget`, `modelStandard`, `minSpec`, `maxSpec`, `isSpecSkipped`, `processLarge`, `processMiddle`, `pipeList` |
| 계산 요청 Pipe | `seq`, `type`, `inletDiameter`, `length`, `angle`, `outletDiameter`, `quantity` |
| 계산 결과 row | `id`, `chamberId`, `chamberName`, `confirmFlag`, `processLarge`, `processMiddle`, `modelStandard`, `minSpec`, `maxSpec`, `conductance`, `judge` |

조회 모델의 `pipeRows`와 계산 요청의 `pipeList`는 서로 다른 Java 모델에 정의된 정식 필드입니다. F/E는 이 차이만 명시적으로 변환하며 임의 필드 alias를 추가하지 않습니다.

## Oracle 전환 SQL 초안

### 문서 목적과 적용 전제

아래 SQL은 현재 Java Controller, Service, DTO와 TXT mock DB의 업무 흐름을 Oracle로 이전할 때 사용할 수 있는 구현 초안입니다.

- 실제 운영 DB의 스키마명, 테이블명, 컬럼명은 DBA 및 B/E 담당자와 확정한 뒤 치환합니다.
- `:eqId`, `:fabId` 등은 설명용 bind 변수입니다. MyBatis에서는 `#{eqId}`처럼 값 바인딩을 사용합니다.
- `<FAB>_VC_REQ_*`의 `<FAB>`는 SQL 입력값으로 직접 조합하지 않습니다. Java의 FAB 허용 목록(`M14`, `M15`, `M16`)으로 검증한 뒤 Mapper statement를 선택해야 합니다.
- 조회 결과가 Chamber와 Pipe처럼 1:N:N 구조이면 한 번의 큰 JOIN보다 Header, Chamber, Pipe를 분리 조회하여 Java에서 DTO로 조립하는 방식을 권장합니다. 중복 row와 페이징 오류를 줄일 수 있습니다.
- Conductance 계산식과 판정 변환은 현재 `VcCalculationService`의 Java 업무 로직입니다. SQL로 임의 이전하지 않고 DB에는 계산 결과와 판정 결과를 저장합니다.
- `POST /api/vc/sim/result/save`는 현재 Java에서 DB에 저장하지 않습니다. 해당 절의 테이블과 SQL은 운영 저장 기능을 도입할 때 사용할 제안안입니다.

### 논리 테이블 구조

| 구분 | 논리 테이블 | 용도 | 비고 |
| --- | --- | --- | --- |
| 수기 도면 Header | `VC_PORTAL_MANUAL_DRAWING` | 장비, 공사번호, 상태, 모델, Foreline 파일 정보 | 현재 `VC_PORTAL_MANUAL_DRAWING.txt` 대체 |
| 수기 도면 Chamber | `VC_PORTAL_MANUAL_CHAMBER` | 도면별 Chamber와 공정/Spec 정보 | 운영 DB에서는 Header와 분리 권장 |
| 수기 도면 Pipe | `VC_PORTAL_MANUAL_PIPE` | Chamber별 Pipe 구성 | `pipeRows` 원천 |
| 도면별 Spec 선택지 | `VC_PORTAL_DRAWING_SPEC` | 선택한 도면에서 허용할 Model Standard | 없으면 Spec Master 조회로 대체 가능 |
| Spec Master | `VCW_VC_SPEC_MST` | FAB/장비 모델/Chamber 모델별 관리 Spec | 현재 Java 서비스의 기준 테이블명 |
| 계산 요청 Header | `<FAB>_VC_REQ_EQUIPMENT` | 계산 요청 장비 및 진행 상태 | 현재 FAB별 라우팅 구조 유지 |
| 계산 요청 Object | `<FAB>_VC_REQ_OBJECT` | 계산에 사용한 Pipe/Object 입력값 | 요청 재현 및 이력 확인용 |
| 계산 Chamber 결과 | `<FAB>_VC_REQ_CHAMBER` | Chamber별 측정값, 판정, Spec snapshot | 계산 결과 이력 |
| 결과 저장 Master | `VCW_VC_RESULT_MST` | 사용자가 저장한 결과 Header | 운영 구현 제안 테이블 |
| 결과 저장 Detail | `VCW_VC_RESULT_DTL` | 저장 결과의 Chamber row | 운영 구현 제안 테이블 |
| 결과 첨부 | `VCW_VC_RESULT_ATTACH` | Draft 첨부파일 메타데이터 | 운영 구현 제안 테이블 |

> `VC_PORTAL_*`와 `VCW_VC_RESULT_*`는 업무 구조를 설명하기 위한 논리명입니다. 운영 테이블이 이미 있으면 신규 생성하지 않고 해당 테이블에 맞춰 Mapper를 작성합니다.

### API별 SQL 적용 범위

| API | 주요 SQL/처리 |
| --- | --- |
| `GET /api/vc/sim/non-bim/options` | FAB 및 Pipe Type 선택지 조회 |
| `GET /api/vc/sim/non-bim/equipments` | 장비번호 자동완성 조회 |
| `GET /api/vc/sim/non-bim/manual-drawings` | 수기 도면 Header 목록 조회 |
| `GET /api/vc/sim/non-bim/chambers` | 선택 도면의 Chamber/Pipe 조회 |
| `GET /api/vc/sim/non-bim/equipment-spec-options` | 도면 우선, Spec Master 차선 조회 |
| `GET /api/vc/sim/non-bim/foreline-drawing/download` | Foreline 파일 메타데이터 조회 |
| `POST /api/vc/sim/non-bim/calculate` | 계산 요청/입력/Chamber 결과 저장 트랜잭션 |
| `GET /api/vc/sim/calculator/options` | FAB, Model, Model Standard, Pipe Type 조회 |
| `POST /api/vc/sim/calculator/calculate` | 계산 요청/입력/Chamber 결과 저장 트랜잭션 |
| `POST /api/vc/sim/result/save` | 결과 Master/Detail/첨부 저장 제안 |
| `GET /api/vc/specs` | Spec Master 조건 조회 |
| `POST /api/vc/calculate` | 원형 계산 API의 저장 트랜잭션 |
| `GET /api/vc/{fabId}/requests` | FAB별 계산 요청 Header 목록 조회 |

### 1. Non-BIM 선택지 조회

대상 API: `GET /api/vc/sim/non-bim/options`

```sql
/*
 * 업무: 수기 도면 검색 화면에서 사용 가능한 FAB 목록을 조회한다.
 * 조건: 사용 중인 도면만 대상으로 하며 중복 FAB은 제거한다.
 */
SELECT DISTINCT
       D.FAB AS VALUE,
       D.FAB AS LABEL
  FROM VC_PORTAL_MANUAL_DRAWING D
 WHERE D.USE_YN = 'Y'
   AND D.FAB IS NOT NULL
 ORDER BY D.FAB;

/*
 * 업무: Pipe Type 선택지를 공통코드에서 조회한다.
 * 현재 Java enum을 계속 사용할 경우 이 SQL은 필요하지 않다.
 */
SELECT C.CODE AS VALUE,
       C.CODE_NAME AS LABEL
  FROM COM_CODE_DETAIL C
 WHERE C.GROUP_CODE = 'VC_PIPE_TYPE'
   AND C.USE_YN = 'Y'
 ORDER BY C.SORT_SEQ, C.CODE;
```

### 2. 장비번호 자동완성 조회

대상 API: `GET /api/vc/sim/non-bim/equipments?keyword={keyword}`

```sql
/*
 * 업무: 사용자가 입력한 문자열을 포함하는 장비번호 후보를 조회한다.
 * 조회 조건:
 *   1) keyword는 EQ_ID에 대한 부분 일치 조건이다.
 *   2) 같은 장비에 여러 공사번호가 있으면 각각 별도 후보로 반환한다.
 *   3) 자동완성 과조회 방지를 위해 상위 20건만 반환한다.
 */
SELECT D.EQ_ID,
       D.CONSTRUCTION_NO,
       D.EQ_ID || ' / ' || D.CONSTRUCTION_NO AS LABEL
  FROM VC_PORTAL_MANUAL_DRAWING D
 WHERE D.USE_YN = 'Y'
   AND (
        TRIM(:keyword) IS NULL
        OR UPPER(D.EQ_ID) LIKE '%' || UPPER(TRIM(:keyword)) || '%'
       )
 ORDER BY D.EQ_ID, D.CONSTRUCTION_NO
 FETCH FIRST 20 ROWS ONLY;
```

부분 일치 검색은 데이터가 많을 때 일반 인덱스를 충분히 활용하지 못할 수 있습니다. 운영 데이터량이 크면 최소 입력 글자 수를 두거나 앞부분 일치 검색으로 변경하는 방안을 검토합니다.

### 3. 수기 도면 목록 조회

대상 API: `GET /api/vc/sim/non-bim/manual-drawings`

```sql
/*
 * 업무: FAB, 장비번호, 공사번호 조건으로 수기 도면 Header를 조회한다.
 * 조회 조건:
 *   - fab: 선택값이 있으면 완전 일치
 *   - eqId: Controller 필수값, 현재 Java 동작과 동일하게 부분 일치
 *   - constructionNo: 입력값이 있으면 부분 일치
 * 정렬: 공사번호 오름차순
 */
SELECT D.DRAWING_ID              AS ID,
       D.DRAWING_KEY,
       D.CONSTRUCTION_NO,
       D.EQ_ID,
       D.SITE,
       D.FAB,
       D.AREA1,
       D.AREA2,
       D.CHANGE_TYPE,
       D.EQUIPMENT_TYPE,
       D.REQUEST_STATUS,
       D.MODEL,
       D.MAIN_MAKER,
       D.PROCESS_LARGE,
       D.PROCESS_MIDDLE,
       (SELECT COUNT(*)
          FROM VC_PORTAL_MANUAL_CHAMBER C
         WHERE C.DRAWING_ID = D.DRAWING_ID
           AND C.USE_YN = 'Y') AS CHAMBER_COUNT,
       D.FORELINE_CATEGORY_NAME,
       D.FORELINE_REGISTERED_AT,
       D.FORELINE_REGISTERED_BY,
       D.FORELINE_FILE_ID,
       D.FORELINE_FILE_NAME
  FROM VC_PORTAL_MANUAL_DRAWING D
 WHERE D.USE_YN = 'Y'
   AND (TRIM(:fab) IS NULL OR UPPER(D.FAB) = UPPER(TRIM(:fab)))
   AND UPPER(D.EQ_ID) LIKE '%' || UPPER(TRIM(:eqId)) || '%'
   AND (
        TRIM(:constructionNo) IS NULL
        OR UPPER(D.CONSTRUCTION_NO) LIKE '%' || UPPER(TRIM(:constructionNo)) || '%'
       )
 ORDER BY D.CONSTRUCTION_NO;
```

목록 API에서는 Chamber/Pipe 전체를 JOIN하지 않습니다. 상세 구조는 사용자가 도면을 선택한 시점에 Chamber API로 조회하는 것이 응답 크기와 중복 row를 줄이는 데 유리합니다.

### 4. 선택 도면 Chamber와 Pipe 조회

대상 API: `GET /api/vc/sim/non-bim/chambers?eqId={eqId}&constructionNo={constructionNo}`

```sql
/*
 * 업무: 선택한 장비와 공사번호에 속한 기존 Chamber 탭을 조회한다.
 * 업무 PK: EQ_ID + CONSTRUCTION_NO
 * 주의: 기존 탭 이름은 CHAMBER_NAME을 그대로 사용하며 F/E에서 재번호를 부여하지 않는다.
 */
SELECT C.DRAWING_ID,
       C.CHAMBER_ID,
       C.CHAMBER_NAME,
       C.MODEL_STANDARD,
       C.MIN_SPEC,
       C.MAX_SPEC,
       C.PROCESS_LARGE,
       C.PROCESS_MIDDLE,
       C.CHAMBER_SEQ
  FROM VC_PORTAL_MANUAL_DRAWING D
  JOIN VC_PORTAL_MANUAL_CHAMBER C
    ON C.DRAWING_ID = D.DRAWING_ID
   AND C.USE_YN = 'Y'
 WHERE D.USE_YN = 'Y'
   AND UPPER(D.EQ_ID) = UPPER(TRIM(:eqId))
   AND UPPER(D.CONSTRUCTION_NO) = UPPER(TRIM(:constructionNo))
 ORDER BY C.CHAMBER_SEQ, C.CHAMBER_ID;

/*
 * 업무: 위에서 조회한 Chamber의 Pipe row를 조회하여 pipeRows로 조립한다.
 * 조건: DRAWING_ID와 CHAMBER_ID를 모두 사용하여 다른 도면의 동일 Chamber ID와 섞이지 않게 한다.
 */
SELECT P.PIPE_SEQ,
       P.PIPE_TYPE,
       P.INLET_DIA,
       P.PIPE_LENGTH,
       P.ANGLE,
       P.OUTLET_DIA,
       P.QTY
  FROM VC_PORTAL_MANUAL_PIPE P
 WHERE P.DRAWING_ID = :drawingId
   AND P.CHAMBER_ID = :chamberId
   AND P.USE_YN = 'Y'
 ORDER BY P.PIPE_SEQ;
```

### 5. 장비 Spec 선택지 조회

대상 API: `GET /api/vc/sim/non-bim/equipment-spec-options`

현재 Java 로직은 선택 도면에 정의된 Spec 선택지를 먼저 찾고, 없으면 `VCW_VC_SPEC_MST`를 조회합니다. 이 우선순위를 유지하려면 두 단계 조회가 가장 명확합니다.

```sql
/* 1단계: 선택한 도면에 명시적으로 연결된 Model Standard 조회 */
SELECT S.MODEL_STANDARD AS VALUE,
       S.MODEL_STANDARD AS LABEL
  FROM VC_PORTAL_MANUAL_DRAWING D
  JOIN VC_PORTAL_DRAWING_SPEC S
    ON S.DRAWING_ID = D.DRAWING_ID
   AND S.USE_YN = 'Y'
 WHERE D.USE_YN = 'Y'
   AND (TRIM(:eqId) IS NULL OR UPPER(D.EQ_ID) = UPPER(TRIM(:eqId)))
   AND (
        TRIM(:constructionNo) IS NULL
        OR UPPER(D.CONSTRUCTION_NO) = UPPER(TRIM(:constructionNo))
       )
 ORDER BY S.SORT_SEQ, S.MODEL_STANDARD;

/*
 * 2단계: 1단계 결과가 없을 때 Spec Master에서 조회한다.
 * MODEL_SPEC_USE_YN = '0'은 현재 Java의 사용 가능 Spec 조건을 따른다.
 */
SELECT DISTINCT
       M.CHAMB_MODEL_NM AS VALUE,
       M.CHAMB_MODEL_NM AS LABEL
  FROM VCW_VC_SPEC_MST M
 WHERE M.MODEL_SPEC_USE_YN = '0'
   AND (TRIM(:fab) IS NULL OR UPPER(M.FAB_ID) = UPPER(TRIM(:fab)))
   AND (TRIM(:model) IS NULL OR UPPER(M.SET_MODEL_NM) = UPPER(TRIM(:model)))
   AND M.CHAMB_MODEL_NM IS NOT NULL
 ORDER BY M.CHAMB_MODEL_NM;
```

한 SQL의 복잡한 `UNION ALL / NOT EXISTS`로 합치기보다 Service에서 1단계 결과 존재 여부를 판단하는 편이 도면 우선 규칙을 읽고 변경하기 쉽습니다.

### 6. Foreline 도면 다운로드 정보 조회

대상 API: `GET /api/vc/sim/non-bim/foreline-drawing/download`

```sql
/*
 * 업무: 선택한 수기 도면의 Foreline 첨부파일 메타데이터를 조회한다.
 * 필수 업무키: EQ_ID + CONSTRUCTION_NO
 * 보조 식별자: DRAWING_KEY, FILE_ID, FAB
 */
SELECT D.FORELINE_FILE_ID       AS FILE_ID,
       D.FORELINE_FILE_NAME     AS FILE_NAME,
       D.FORELINE_STORAGE_PATH  AS STORAGE_PATH,
       D.FORELINE_CONTENT_TYPE  AS CONTENT_TYPE
  FROM VC_PORTAL_MANUAL_DRAWING D
 WHERE D.USE_YN = 'Y'
   AND UPPER(D.EQ_ID) = UPPER(TRIM(:eqId))
   AND UPPER(D.CONSTRUCTION_NO) = UPPER(TRIM(:constructionNo))
   AND (TRIM(:drawingKey) IS NULL OR D.DRAWING_KEY = TRIM(:drawingKey))
   AND (TRIM(:fileId) IS NULL OR D.FORELINE_FILE_ID = TRIM(:fileId))
   AND (TRIM(:fab) IS NULL OR UPPER(D.FAB) = UPPER(TRIM(:fab)));
```

DB에는 파일명과 저장 위치만 두고 실제 파일은 ECM, NAS 또는 Object Storage에서 읽는 방식을 권장합니다. 운영 정책상 Oracle BLOB을 사용한다면 `FILE_CONTENT` BLOB 컬럼을 함께 조회하되, 대용량 파일은 반드시 streaming response로 반환합니다.

### 7. Calculator 선택지 조회

대상 API: `GET /api/vc/sim/calculator/options`

```sql
/* Calculator에서 선택 가능한 FAB */
SELECT DISTINCT D.FAB AS VALUE, D.FAB AS LABEL
  FROM VC_PORTAL_MANUAL_DRAWING D
 WHERE D.USE_YN = 'Y'
   AND D.FAB IS NOT NULL
 ORDER BY D.FAB;

/* Calculator에서 선택 가능한 장비 Model */
SELECT DISTINCT D.MODEL AS VALUE, D.MODEL AS LABEL
  FROM VC_PORTAL_MANUAL_DRAWING D
 WHERE D.USE_YN = 'Y'
   AND D.MODEL IS NOT NULL
 ORDER BY D.MODEL;

/*
 * Calculator의 Model Standard.
 * 현재 Java preview는 M16을 기본 FAB로 사용한다.
 * 운영 전환 시에는 화면에서 선택한 FAB/Model을 조건으로 받도록 API 계약 확장을 권장한다.
 */
SELECT DISTINCT M.CHAMB_MODEL_NM AS VALUE,
                M.CHAMB_MODEL_NM AS LABEL
  FROM VCW_VC_SPEC_MST M
 WHERE M.MODEL_SPEC_USE_YN = '0'
   AND M.FAB_ID = NVL(TRIM(:fabId), 'M16')
   AND (TRIM(:setModelNm) IS NULL OR M.SET_MODEL_NM = TRIM(:setModelNm))
 ORDER BY M.CHAMB_MODEL_NM;

/* Pipe Type은 1번 API와 동일한 공통코드 SQL을 재사용한다. */
SELECT C.CODE AS VALUE, C.CODE_NAME AS LABEL
  FROM COM_CODE_DETAIL C
 WHERE C.GROUP_CODE = 'VC_PIPE_TYPE'
   AND C.USE_YN = 'Y'
 ORDER BY C.SORT_SEQ, C.CODE;
```

### 8. Spec Master 직접 조회

대상 API: `GET /api/vc/specs?fabId={fabId}&setModelNm={setModelNm}`

```sql
/*
 * 업무: 계산과 판정에 사용할 Spec Master 후보를 조회한다.
 * fabId는 필수이며 setModelNm은 선택 조건이다.
 */
SELECT M.SPEC_ID,
       M.SPEC_NM,
       M.FAB_ID,
       M.SET_MODEL_NM,
       M.OPER_LARGE_CATG_VAL,
       M.OPER_MID_CATG_VAL,
       M.CHAMB_MODEL_NM,
       M.MODEL_SPEC_USE_YN,
       M.MGMT_TGT_YN,
       M.SPEC_MIN_VAL,
       M.SPEC_MAX_VAL,
       M.CHGR_EMPNO,
       M.CHGR_NM
  FROM VCW_VC_SPEC_MST M
 WHERE M.MODEL_SPEC_USE_YN = '0'
   AND M.FAB_ID = TRIM(:fabId)
   AND (TRIM(:setModelNm) IS NULL OR M.SET_MODEL_NM = TRIM(:setModelNm))
 ORDER BY M.SET_MODEL_NM, M.CHAMB_MODEL_NM, M.SPEC_ID;
```

### 9. 계산 API 공통 트랜잭션

대상 API:

- `POST /api/vc/sim/non-bim/calculate`
- `POST /api/vc/sim/calculator/calculate`
- `POST /api/vc/calculate`

세 API는 요청 DTO 모양이 일부 다르지만 최종적으로 `VcCalculationService`의 동일 계산 흐름을 사용합니다. 아래 SQL은 한 트랜잭션에서 실행하며 중간 실패 시 전체 rollback해야 합니다.

현재 Conductance 계산식은 다음과 같으며 Java 계산 엔진의 책임으로 유지합니다.

| Pipe Type | 계산식 | 비고 |
| --- | --- | --- |
| `PIPE` | `inletDiameter * 9 - length * 0.012` | 누적값에 합산 |
| `ELBOW` | `inletDiameter * 6 - angle * 0.06 - quantity * 2.2` | quantity는 최소 1 |
| `REDUCER` | `outletDiameter * 7 - length * 0.01` | 누적값에 합산 |

최종 합계는 최소 `1`, 소수 둘째 자리 반올림 값으로 저장합니다. 계산식을 SQL과 Java 양쪽에 중복 구현하면 결과가 달라질 수 있으므로 한 계층에서만 관리합니다.

#### 9.1 계산 요청 GUID 생성

GUID는 현재처럼 Java에서 생성해 모든 INSERT에 전달하는 방식을 권장합니다. Oracle에서 생성할 경우 다음 값을 먼저 조회할 수 있습니다.

```sql
SELECT RAWTOHEX(SYS_GUID()) AS GUID
  FROM DUAL;
```

#### 9.2 계산 요청 Header 저장

```sql
/*
 * 업무: 계산 요청의 장비, 작업자, 진행 상태를 Header로 저장한다.
 * 아래 예시는 M16이며 M14/M15도 검증된 FAB별 Mapper를 사용한다.
 */
INSERT INTO M16_VC_REQ_EQUIPMENT (
       GUID, FAB_ID, FAB_EQP_ID, WO_ID,
       BUILDING_ID, AREA_ID, DAREA_ID,
       EQP_MAKER_NM, EQP_MODEL_NM, DWG_GBN_NM,
       VER_VAL, HAND_ENTRY_YN,
       WORK_EMPNO, WORK_NM, WORK_TM,
       PRGS_STAT_CD,
       DOWNLOAD_URL, FILE_NM, FOLDER_PATH_VAL,
       SPEC_YN, CONV_YN, INQ_YN,
       WORK_STAT_CD, PROC_YN,
       DOC_URL,
       REG_EMPNO, REG_TM, CHG_EMPNO, CHG_TM
) VALUES (
       :guid, :fabId, :fabEqpId, :woId,
       :buildingId, :areaId, :dareaId,
       :eqpMakerNm, :eqpModelNm, :dwgGbnNm,
       :verVal, :handEntryYn,
       :workEmpno, :workNm, SYSTIMESTAMP,
       :prgsStatCd,
       :downloadUrl, :fileNm, :folderPathVal,
       'NA', 'N', 'Y',
       '0', 'N',
       :docUrl,
       :regEmpno, SYSTIMESTAMP, NULL, NULL
);
```

현재 Java 변환 기준으로 `DWG_GBN_NM='FORELINE'`, `VER_VAL='1'`, `HAND_ENTRY_YN='Y'`, `PRGS_STAT_CD='1'`이며 파일 관련 값은 빈 값입니다. 운영에서는 코드값의 의미를 공통코드로 정의하고, 하드코딩 대신 코드 상수 또는 DB 코드 테이블을 사용합니다.

#### 9.3 Pipe/Object 입력값 batch 저장

```sql
/*
 * 업무: 사용자가 계산에 입력한 Pipe/Object를 저장하여 계산 요청을 재현할 수 있게 한다.
 * 실행: request의 모든 Chamber.pipeList를 순회하며 batch INSERT한다.
 */
INSERT INTO M16_VC_REQ_OBJECT (
       GUID, CHAMB_NM_INDEX_VAL, OBJECT_SEQ,
       OBJECT_TYPE_CD, OBJECT_TYPE_NM,
       SECTION_GBN_CD, SECTION_GBN_NM,
       EQP_CONN_POINT_VAL,
       INLET_DIAMETER_VAL, INLET_DIAMETER_UNIT_CD,
       LENGTH_VAL, LENGTH_UNIT_CD,
       ANGLE_VAL,
       OUTLET_DIAMETER_VAL, OUTLET_DIAMETER_UNIT_CD,
       QTY_VAL, SORT_SEQ, USE_YN,
       REG_EMPNO, REG_TM
) VALUES (
       :guid, :chamberSeq, :objectSeq,
       :objectTypeCd, :objectTypeNm,
       :sectionGbnCd, :sectionGbnNm,
       :eqpConnPointVal,
       :inletDiameter, :inletDiameterUnitCd,
       :length, :lengthUnitCd,
       :angle,
       :outletDiameter, :outletDiameterUnitCd,
       :quantity, :sortSeq, 'Y',
       :regEmpno, SYSTIMESTAMP
);
```

#### 9.4 Chamber별 판정 Spec 조회

```sql
/*
 * 업무: FAB, 장비 Model, Chamber Model에 맞는 유효 Spec 한 건을 조회한다.
 * 동일 조건의 유효 Spec이 여러 건이면 업무적으로 우선순위 컬럼을 확정해야 한다.
 */
SELECT *
  FROM (
        SELECT M.SPEC_ID,
               M.SPEC_MIN_VAL,
               M.SPEC_MAX_VAL,
               M.MGMT_TGT_YN,
               M.OPER_LARGE_CATG_VAL,
               M.OPER_MID_CATG_VAL,
               M.CHAMB_MODEL_NM
          FROM VCW_VC_SPEC_MST M
         WHERE M.MODEL_SPEC_USE_YN = '0'
           AND M.FAB_ID = :fabId
           AND M.SET_MODEL_NM = :setModelNm
           AND M.CHAMB_MODEL_NM = :chambModelNm
         ORDER BY M.SPEC_ID
       )
 WHERE ROWNUM = 1;
```

현재 판정 규칙은 Java에서 다음 순서로 적용합니다.

1. Spec이 없거나 관리 대상이 아니면 `NA`
2. 계산값이 최소값보다 작으면 `NG_L`
3. 계산값이 최대값보다 크면 `NG_H`
4. 범위 안이면 `OK`

화면용 결과에서는 `OK -> IN`, `NG_L -> LOW_OUT`, `NG_H -> HIGH_OUT`, `NA -> NA`로 변환합니다.

#### 9.5 Chamber 계산 결과 저장

```sql
/*
 * 업무: Java에서 계산한 Conductance와 판정 결과를 Chamber 단위로 저장한다.
 * Spec 값은 추후 Master 변경의 영향을 받지 않도록 snapshot으로 함께 저장한다.
 */
INSERT INTO M16_VC_REQ_CHAMBER (
       GUID, CHAMB_NM_INDEX_VAL, CHAMBER_ID,
       FAB_ID, SET_MODEL_NM,
       OPER_LARGE_CATG_VAL, OPER_MID_CATG_VAL,
       CHAMB_MODEL_NM, MEAS_VAL, JUDGE_RSLT_VAL,
       SPEC_ID, EQP_CONN_POINT_VAL,
       SPEC_MIN_VAL_SNAP, SPEC_MAX_VAL_SNAP, MGMT_TGT_YN_SNAP,
       REG_EMPNO, REG_TM
) VALUES (
       :guid, :chamberSeq, :chamberId,
       :fabId, :setModelNm,
       :processLarge, :processMiddle,
       :chambModelNm, :conductance, :judgeResult,
       :specId, :eqpConnPointVal,
       :specMinVal, :specMaxVal, :mgmtTgtYn,
       :regEmpno, SYSTIMESTAMP
);
```

#### 9.6 Header Spec 판정 여부 갱신

```sql
/*
 * 업무: Chamber 중 하나라도 LOW/HIGH 판정이면 Header의 SPEC_YN을 Y로 표시한다.
 * 현재 저장값이 OK/NG_L/NG_H/NA인 구조를 기준으로 한다.
 */
UPDATE M16_VC_REQ_EQUIPMENT E
   SET E.SPEC_YN = CASE
                     WHEN EXISTS (
                          SELECT 1
                            FROM M16_VC_REQ_CHAMBER C
                           WHERE C.GUID = E.GUID
                             AND C.JUDGE_RSLT_VAL IN ('NG_L', 'NG_H')
                     ) THEN 'Y'
                     ELSE 'N'
                   END,
       E.CHG_EMPNO = :chgEmpno,
       E.CHG_TM = SYSTIMESTAMP
 WHERE E.GUID = :guid;
```

### 10. FAB별 계산 요청 목록 조회

대상 API: `GET /api/vc/{fabId}/requests`

```sql
/*
 * 업무: 선택한 FAB의 계산 요청 Header 이력을 최신순으로 조회한다.
 * 테이블명은 fabId를 문자열 치환하지 않고 허용된 Mapper 중 하나를 선택한다.
 */
SELECT E.GUID,
       E.FAB_ID,
       E.FAB_EQP_ID,
       E.WO_ID,
       E.EQP_MAKER_NM,
       E.EQP_MODEL_NM,
       E.DWG_GBN_NM,
       E.HAND_ENTRY_YN,
       E.WORK_EMPNO,
       E.WORK_NM,
       E.WORK_TM,
       E.PRGS_STAT_CD,
       E.SPEC_YN,
       E.PROC_YN,
       E.REG_TM
  FROM M16_VC_REQ_EQUIPMENT E
 ORDER BY E.REG_TM DESC, E.GUID DESC;
```

M14와 M15도 동일한 SELECT 컬럼으로 각각 `M14_VC_REQ_EQUIPMENT`, `M15_VC_REQ_EQUIPMENT` Mapper를 작성합니다.

### 11. 계산 결과 저장 제안

대상 API: `POST /api/vc/sim/result/save`

현재 구현은 `savedId`, 저장시간, 상태를 응답으로 생성할 뿐 DB에 저장하지 않습니다. 운영 저장이 필요하면 다음과 같이 Master, Detail, 첨부 메타데이터를 하나의 트랜잭션으로 저장할 수 있습니다.

```sql
/* 1) 저장 결과 Header */
INSERT INTO VCW_VC_RESULT_MST (
       SAVED_ID, SOURCE_TYPE,
       FAB_ID, MODEL_NM, EQ_ID, CONSTRUCTION_NO,
       ROW_COUNT, DRAFT_ATTACHED_YN, STATUS_CD,
       REG_EMPNO, REG_TM
) VALUES (
       :savedId, :sourceType,
       :fabId, :model, :eqId, :constructionNo,
       :rowCount, :draftAttachedYn, :status,
       :regEmpno, SYSTIMESTAMP
);

/* 2) 결과 row batch 저장 */
INSERT INTO VCW_VC_RESULT_DTL (
       SAVED_ID, ROW_SEQ,
       CHAMBER_ID, CHAMBER_NAME, CONFIRM_FLAG,
       PROCESS_LARGE, PROCESS_MIDDLE, MODEL_STANDARD,
       MIN_SPEC, MAX_SPEC, CONDUCTANCE, JUDGE,
       REG_EMPNO, REG_TM
) VALUES (
       :savedId, :rowSeq,
       :chamberId, :chamberName, :confirmFlag,
       :processLarge, :processMiddle, :modelStandard,
       :minSpec, :maxSpec, :conductance, :judge,
       :regEmpno, SYSTIMESTAMP
);

/* 3) Draft 첨부가 있는 경우에만 파일 메타데이터 저장 */
INSERT INTO VCW_VC_RESULT_ATTACH (
       SAVED_ID, ATTACH_SEQ,
       ATTACHMENT_ID, FILE_NAME, TITLE, COMMENTS,
       REG_EMPNO, REG_TM
) VALUES (
       :savedId, :attachSeq,
       :attachmentId, :fileName, :title, :comments,
       :regEmpno, SYSTIMESTAMP
);
```

결과 저장만으로 `VC_PORTAL_MANUAL_DRAWING.REQUEST_STATUS`를 자동 변경하지 않습니다. 도면 상태 변경이 필요하면 상태 전이 규칙, 권한, 이력 테이블을 별도 업무 계약으로 확정한 뒤 독립된 Service에서 처리합니다.

### 인덱스와 운영 구현 점검사항

```sql
/* 업무키 조회 */
CREATE INDEX IX_VC_MANUAL_DRAWING_01
    ON VC_PORTAL_MANUAL_DRAWING (EQ_ID, CONSTRUCTION_NO, USE_YN);

/* 도면 상세 조회 */
CREATE INDEX IX_VC_MANUAL_CHAMBER_01
    ON VC_PORTAL_MANUAL_CHAMBER (DRAWING_ID, CHAMBER_SEQ, USE_YN);

CREATE INDEX IX_VC_MANUAL_PIPE_01
    ON VC_PORTAL_MANUAL_PIPE (DRAWING_ID, CHAMBER_ID, PIPE_SEQ, USE_YN);

/* 계산 Spec 조회 */
CREATE INDEX IX_VCW_VC_SPEC_MST_01
    ON VCW_VC_SPEC_MST (
       FAB_ID, SET_MODEL_NM, CHAMB_MODEL_NM, MODEL_SPEC_USE_YN
    );

/* 계산 요청 상세 조회 */
CREATE INDEX IX_M16_VC_REQ_OBJECT_01
    ON M16_VC_REQ_OBJECT (GUID, CHAMB_NM_INDEX_VAL, OBJECT_SEQ);

CREATE INDEX IX_M16_VC_REQ_CHAMBER_01
    ON M16_VC_REQ_CHAMBER (GUID, CHAMB_NM_INDEX_VAL, CHAMBER_ID);
```

- M14/M15 요청 테이블에도 M16과 동일한 인덱스를 적용합니다.
- `UPPER(EQ_ID) LIKE '%값%'` 형태의 부분 일치는 일반 인덱스 효율이 낮습니다. 운영 건수와 검색 패턴을 확인하여 Oracle Text 또는 검색 조건 변경을 검토합니다.
- 계산 Header/Object/Chamber 저장과 결과 Master/Detail/첨부 저장은 각각 `@Transactional` 단위로 처리합니다.
- 금액이 아닌 수치라도 Spec과 Conductance는 문자열이 아닌 `NUMBER(p,s)`로 저장하여 비교 및 정렬 오류를 방지합니다.
- 판정 당시의 최소/최대 Spec과 관리대상 여부를 Chamber 결과에 snapshot으로 남겨야 Master 변경 후에도 과거 결과를 설명할 수 있습니다.
- 파일 다운로드 SQL은 파일의 소유권과 접근 권한을 확인한 뒤 storage path를 사용해야 하며, 경로 문자열을 그대로 클라이언트에 노출하지 않습니다.
