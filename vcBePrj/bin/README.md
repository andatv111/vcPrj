# vcBePrj bin

이 폴더는 STS/Eclipse가 실행 과정에서 사용할 수 있는 보조 위치입니다. 실제 소스, mock DB, API 계약 문서는 이 폴더가 아니라 아래 위치를 기준으로 관리합니다.

| 목적 | 기준 위치 |
| --- | --- |
| B/E 실행 설명 | `vcBePrj/README.md` |
| F/E 실행 설명 | `README.md` |
| API 계약 | `README_API.md` |
| Mock table | `vcBePrj/data/*.txt` |
| Java source | `vcBePrj/src/main/java` |
| Java test | `vcBePrj/src/test/java` |

이 폴더에는 업무 계약이나 DTO 설명을 중복해서 작성하지 않습니다. 내용이 어긋나면 STS 실행보다 루트 문서와 소스가 우선입니다.
