## git (codex는 내가 직접 git 추가한 내용 지우지 말것) 
1. 집 PC에서 Codex + Git 연결
#Git 사용자 정보를 먼저 등록
git config --global user.email "ngoprds1@gmail.com"
git config --global user.name "andatv"
# 설정 확인
git config --global --list
#그 다음 현재 프로젝트 폴더에서:
git status
# 파일들이 보이면
git add .
git commit -m "initial commit"
# 성공하면
# 집 PC에서 Codex + Git 연결
git init
git remote add origin https://github.com/andatv111/vcPrj.git
git add .
git commit -m "initial commit"
git branch -M main
git push -u origin main
git branch -M main
git push -u origin main
# 단, 이미 git init, remote add origin을 했다면 다시 하지 말고 이것만 하세요.
git add .
git commit -m "initial commit"
git branch -M main
git push -u origin main
2. Codex에서 작업을 위해 codex-work 브랜치만들기
git checkout main
git checkout -b codex-work
git push -u origin codex-work
# codex-work 로컬작성 후 원격소스반영
git checkout codex-work
git add .
git commit -m "codex update"
git push -u origin codex-work
# 이미 커밋되어 있다면,
git push -u origin codex-work
# GitHub에서 PR Merge
Pull Request 생성
codex-work -> main
# 집 PC에서 바로 Merge
git checkout main
git pull origin main
git merge codex-work
git push origin main
