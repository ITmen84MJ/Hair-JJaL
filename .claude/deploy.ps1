# 자동 배포 스크립트 — PostToolUse 훅에서 호출됨
# Edit/Write 도구 실행 후 변경사항을 자동으로 커밋하고 origin/main 으로 푸시

$projectDir = "C:\Users\icete\Desktop\AI서비스 학습\Claude Code\hair-consultation"
Push-Location $projectDir

try {
    # 변경된 파일 스테이징
    git add -A

    # 스테이징된 변경사항이 있는 경우에만 커밋
    $staged = git diff --cached --name-only 2>$null
    if ($staged) {
        $ts = Get-Date -Format "HH:mm"
        git commit -m "auto-deploy $ts"
        git push origin main
        Write-Output "✅ 배포 완료 ($ts)"
    }
} catch {
    Write-Output "⚠️ 배포 오류: $_"
} finally {
    Pop-Location
}
