# SpecMaster 조회 및 페이징 흐름

## Master 조회

화면 로딩과 Search 시 `POST /api/vc/specmaster/selectcondition`을 호출한다.
요청에는 조회조건만 포함하며 응답은 Master `rows`만 반환한다.

```json
{
  "fabId": "M14",
  "setModelNm": "LITHO-Track-4",
  "specNm": "Litho"
}
```

```json
{
  "rows": [
    {
      "specId": "SPEC-M14-LITHO-A",
      "upperCd": "",
      "specNm": "M14 Litho Track"
    }
  ]
}
```

화면은 첫 Master를 자동 선택하고 곧바로 Detail을 조회한다.

## Detail 조회

Master radio 선택마다 다음 API를 호출한다.

```text
GET /api/vc/specmaster/{selectedSpecId}/children
```

응답 Detail은 선택 Master의 우측 Grid에 즉시 반영하며 첫 행을 자동 선택한다.

## F/E 페이징

- B/E와 `page`, `size`, `totalPages`, `totalElements`를 주고받지 않는다.
- Master와 Detail 모두 10행 단위로 F/E에서 자른다.
- No는 `page * pageSize + 현재 행 index + 1`로 계산한다.
- 필터 결과에도 같은 계산을 적용하므로 다음 페이지 No가 다시 1로 시작하지 않는다.
- 저장·수정 후 검색/헤더 필터를 정리하고 저장된 row가 있는 페이지로 이동해 radio를 자동 선택한다.
- 삭제 후 다음 row를 선택하고, 다음 row가 없으면 이전 row를 선택한다.
- 필터로 선택 row가 사라지면 첫 번째 유효 row를 선택한다.

## 관련 소스

- `src/components/vc/admin/spec/SpecMgmt.js`
- `src/components/vc/admin/spec/core/SpecMgmt.core.js`
- `src/components/vc/admin/spec/ui/SpecMgmtGrid.js`
- `src/store/vc/spec/reducer.js`
- `src/saga/vc/admin/specSaga.js`
- `src/service/api/vc/admin/specApi.js`
- `VcSpecMasterController`
