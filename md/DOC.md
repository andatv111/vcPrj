# Git 작업 메모

이 문서는 로컬 PC에서 Codex 작업 브랜치를 GitHub에 올릴 때 사용하는 짧은 절차입니다. 프로젝트 기능 설명은 `README.md`, Simulation API 계약은 `md/SIM_API.md`, SpecMaster API 계약은 `md/SPEC_MASTER_API.md`, 화면 코드 이해는 `md/simReview.md`와 `md/specMasterReview.md`, B/E 실행 설명은 `vcBePrj/README.md`를 기준으로 봅니다.

## 최초 설정

```powershell
git config --global user.email "ngoprds1@gmail.com"
git config --global user.name "andatv"
git config --global --list
```

이미 저장소가 초기화되어 있다면 `git init`과 `git remote add`를 다시 실행하지 않습니다.

```powershell
git status
git remote -v
```

## 작업 브랜치

Codex 작업은 `main`에서 바로 하지 않고 `codex-work` 같은 별도 브랜치에서 진행합니다.

```powershell
git checkout main
git pull origin main
git checkout -b codex-work
git push -u origin codex-work
```

이미 브랜치가 있으면 새로 만들지 않고 이동만 합니다.

```powershell
git checkout codex-work
```

## 변경 반영

```powershell
git status
git add .
git commit -m "Update vc simulation flow"
git push -u origin codex-work
```

GitHub에서 Pull Request를 만들 때는 `codex-work -> main` 방향으로 생성합니다.

## 회사 시스템 반입 메모

`scripts/verify-vc-calculation.mjs`는 개발 검증용입니다. React 화면이 import하지 않고 `npm run test:vc`에서만 실행하므로 운영 런타임 파일이 아닙니다.

반입 전 확인:

```powershell
npm run test:vc
npm run build
```

회사 정책상 테스트 스크립트를 운영 저장소에 둘 수 없으면 `scripts/` 폴더는 제외할 수 있습니다. 다만 그 경우 V/C 화면 의도 회귀를 자동으로 확인하는 안전장치도 같이 빠집니다.

## PR Merge 후 로컬 갱신

```powershell
git checkout main
git pull origin main
```

필요하면 작업 브랜치를 최신 main 기준으로 다시 맞춘 뒤 다음 작업을 시작합니다.
