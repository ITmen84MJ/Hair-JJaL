# 자동 배포 스크립트 — PostToolUse 훅에서 호출됨
# 훅은 이미 프로젝트 루트에서 실행되므로 cd 불필요

git add -A

$staged = git diff --cached --name-only 2>$null
if ($staged) {
    $ts = Get-Date -Format "HH:mm"
    git commit -m "auto-deploy $ts"
    git push origin main
    Write-Output "배포 완료 ($ts)"
}
