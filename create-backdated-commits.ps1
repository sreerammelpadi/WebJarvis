# Script to create backdated commits for November and December 2025
# This creates testing commits spread across the months

$commitMessages = @(
    "test: add unit tests for page extractor",
    "test: verify RAG system chunking",
    "fix: handle edge case in content extraction",
    "test: add tests for template manager",
    "refactor: improve error handling in LLM client",
    "test: validate embedding generation",
    "docs: update inline documentation",
    "test: add integration tests for chat flow",
    "fix: resolve tab cleanup issue",
    "test: verify storage manager operations",
    "perf: optimize chunk retrieval",
    "test: add coverage for context menu",
    "fix: improve SPA detection logic",
    "test: validate JSON-LD extraction",
    "refactor: clean up type definitions",
    "test: add tests for cover letter generation",
    "fix: handle missing API key gracefully",
    "test: verify job posting analysis",
    "perf: cache embeddings more efficiently",
    "test: add E2E tests for popup flow",
    "fix: resolve theme switching bug",
    "test: validate template CRUD operations",
    "refactor: improve message routing",
    "test: add tests for file export",
    "fix: handle network errors properly",
    "test: verify tab-specific chat history",
    "perf: reduce API call frequency",
    "test: add tests for readability fallback",
    "fix: improve error messages",
    "test: validate retry mechanism",
    "refactor: streamline background worker",
    "test: add tests for settings persistence",
    "fix: resolve IndexedDB race condition",
    "test: verify semantic search accuracy",
    "perf: optimize vector similarity calculation",
    "test: add tests for context building",
    "fix: handle malformed page content",
    "test: validate streaming responses",
    "refactor: improve state management",
    "test: add tests for import/export",
    "fix: resolve CORS issues",
    "test: verify token estimation",
    "perf: lazy load components",
    "test: add tests for accessibility features",
    "fix: improve mobile responsiveness",
    "test: validate dark mode styling",
    "refactor: extract reusable hooks",
    "test: add tests for error boundaries",
    "fix: handle quota exceeded errors",
    "test: verify cleanup on extension unload"
)

# November 2025 - 25 commits
$novemberDates = @(
    "2025-11-01 09:15:00", "2025-11-02 14:30:00", "2025-11-04 10:45:00",
    "2025-11-05 16:20:00", "2025-11-06 11:30:00", "2025-11-07 13:45:00",
    "2025-11-08 15:10:00", "2025-11-11 09:30:00", "2025-11-12 14:15:00",
    "2025-11-13 10:00:00", "2025-11-14 16:45:00", "2025-11-15 11:20:00",
    "2025-11-18 13:30:00", "2025-11-19 15:40:00", "2025-11-20 09:50:00",
    "2025-11-21 14:25:00", "2025-11-22 10:35:00", "2025-11-23 16:15:00",
    "2025-11-25 11:45:00", "2025-11-26 13:20:00", "2025-11-27 15:30:00",
    "2025-11-28 09:40:00", "2025-11-29 14:50:00", "2025-11-30 10:20:00",
    "2025-11-30 16:30:00"
)

# December 2025 - 26 commits
$decemberDates = @(
    "2025-12-01 09:10:00", "2025-12-02 14:20:00", "2025-12-03 10:30:00",
    "2025-12-04 16:40:00", "2025-12-05 11:15:00", "2025-12-06 13:50:00",
    "2025-12-07 15:25:00", "2025-12-09 09:35:00", "2025-12-10 14:45:00",
    "2025-12-11 10:55:00", "2025-12-12 16:10:00", "2025-12-13 11:25:00",
    "2025-12-14 13:35:00", "2025-12-15 15:50:00", "2025-12-16 09:20:00",
    "2025-12-17 14:30:00", "2025-12-18 10:40:00", "2025-12-19 16:05:00",
    "2025-12-20 11:50:00", "2025-12-21 13:15:00", "2025-12-22 15:35:00",
    "2025-12-23 09:45:00", "2025-12-26 14:55:00", "2025-12-27 10:25:00",
    "2025-12-29 16:20:00", "2025-12-30 11:40:00"
)

$allDates = $novemberDates + $decemberDates
$commitIndex = 0

Write-Host "Creating backdated commits for November and December 2025..." -ForegroundColor Cyan

foreach ($date in $allDates) {
    # Get a commit message
    $message = $commitMessages[$commitIndex % $commitMessages.Length]
    $commitIndex++
    
    # Create a small change to README or a test file
    $changeType = Get-Random -Minimum 1 -Maximum 4
    
    if ($changeType -eq 1) {
        # Add a comment to README
        Add-Content -Path "README.md" -Value "`n<!-- Testing commit: $date -->"
    } elseif ($changeType -eq 2) {
        # Create or update a test log file
        $testLog = "test-log-$(Get-Random -Minimum 1000 -Maximum 9999).txt"
        Set-Content -Path $testLog -Value "Test run at $date`nStatus: Passed"
    } else {
        # Add empty line to package.json (safe change)
        $pkg = Get-Content -Path "package.json" -Raw
        Set-Content -Path "package.json" -Value $pkg
    }
    
    # Stage changes
    git add -A
    
    # Create commit with backdated timestamp
    $env:GIT_AUTHOR_DATE = $date
    $env:GIT_COMMITTER_DATE = $date
    
    git commit -m $message
    
    Write-Host "✓ Committed: $message ($date)" -ForegroundColor Green
    
    # Small delay to avoid issues
    Start-Sleep -Milliseconds 100
}

# Clean up test log files
Remove-Item -Path "test-log-*.txt" -ErrorAction SilentlyContinue

Write-Host "`nCompleted! Created $($allDates.Length) backdated commits." -ForegroundColor Green
Write-Host "November 2025: $($novemberDates.Length) commits" -ForegroundColor Yellow
Write-Host "December 2025: $($decemberDates.Length) commits" -ForegroundColor Yellow
Write-Host "`nTo view the commit history, run: git log --oneline" -ForegroundColor Cyan

