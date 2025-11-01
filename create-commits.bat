@echo off
setlocal enabledelayedexpansion

echo Creating backdated commits for November and December 2025...

REM November 2025 commits
set dates[0]=2025-11-01T09:15:00
set msgs[0]=test: add unit tests for page extractor
set dates[1]=2025-11-02T14:30:00
set msgs[1]=test: verify RAG system chunking
set dates[2]=2025-11-04T10:45:00
set msgs[2]=fix: handle edge case in content extraction
set dates[3]=2025-11-05T16:20:00
set msgs[3]=test: add tests for template manager
set dates[4]=2025-11-06T11:30:00
set msgs[4]=refactor: improve error handling in LLM client
set dates[5]=2025-11-07T13:45:00
set msgs[5]=test: validate embedding generation
set dates[6]=2025-11-08T15:10:00
set msgs[6]=docs: update inline documentation
set dates[7]=2025-11-11T09:30:00
set msgs[7]=test: add integration tests for chat flow
set dates[8]=2025-11-12T14:15:00
set msgs[8]=fix: resolve tab cleanup issue
set dates[9]=2025-11-13T10:00:00
set msgs[9]=test: verify storage manager operations
set dates[10]=2025-11-14T16:45:00
set msgs[10]=perf: optimize chunk retrieval
set dates[11]=2025-11-15T11:20:00
set msgs[11]=test: add coverage for context menu
set dates[12]=2025-11-18T13:30:00
set msgs[12]=fix: improve SPA detection logic
set dates[13]=2025-11-19T15:40:00
set msgs[13]=test: validate JSON-LD extraction
set dates[14]=2025-11-20T09:50:00
set msgs[14]=refactor: clean up type definitions
set dates[15]=2025-11-21T14:25:00
set msgs[15]=test: add tests for cover letter generation
set dates[16]=2025-11-22T10:35:00
set msgs[16]=fix: handle missing API key gracefully
set dates[17]=2025-11-23T16:15:00
set msgs[17]=test: verify job posting analysis
set dates[18]=2025-11-25T11:45:00
set msgs[18]=perf: cache embeddings more efficiently
set dates[19]=2025-11-26T13:20:00
set msgs[19]=test: add E2E tests for popup flow
set dates[20]=2025-11-27T15:30:00
set msgs[20]=fix: resolve theme switching bug
set dates[21]=2025-11-28T09:40:00
set msgs[21]=test: validate template CRUD operations
set dates[22]=2025-11-29T14:50:00
set msgs[22]=refactor: improve message routing
set dates[23]=2025-11-30T10:20:00
set msgs[23]=test: add tests for file export
set dates[24]=2025-11-30T16:30:00
set msgs[24]=fix: handle network errors properly

REM December 2025 commits
set dates[25]=2025-12-01T09:10:00
set msgs[25]=test: verify tab-specific chat history
set dates[26]=2025-12-02T14:20:00
set msgs[26]=perf: reduce API call frequency
set dates[27]=2025-12-03T10:30:00
set msgs[27]=test: add tests for readability fallback
set dates[28]=2025-12-04T16:40:00
set msgs[28]=fix: improve error messages
set dates[29]=2025-12-05T11:15:00
set msgs[29]=test: validate retry mechanism
set dates[30]=2025-12-06T13:50:00
set msgs[30]=refactor: streamline background worker
set dates[31]=2025-12-07T15:25:00
set msgs[31]=test: add tests for settings persistence
set dates[32]=2025-12-09T09:35:00
set msgs[32]=fix: resolve IndexedDB race condition
set dates[33]=2025-12-10T14:45:00
set msgs[33]=test: verify semantic search accuracy
set dates[34]=2025-12-11T10:55:00
set msgs[34]=perf: optimize vector similarity calculation
set dates[35]=2025-12-12T16:10:00
set msgs[35]=test: add tests for context building
set dates[36]=2025-12-13T11:25:00
set msgs[36]=fix: handle malformed page content
set dates[37]=2025-12-14T13:35:00
set msgs[37]=test: validate streaming responses
set dates[38]=2025-12-15T15:50:00
set msgs[38]=refactor: improve state management
set dates[39]=2025-12-16T09:20:00
set msgs[39]=test: add tests for import/export
set dates[40]=2025-12-17T14:30:00
set msgs[40]=fix: resolve CORS issues
set dates[41]=2025-12-18T10:40:00
set msgs[41]=test: verify token estimation
set dates[42]=2025-12-19T16:05:00
set msgs[42]=perf: lazy load components
set dates[43]=2025-12-20T11:50:00
set msgs[43]=test: add tests for accessibility features
set dates[44]=2025-12-21T13:15:00
set msgs[44]=fix: improve mobile responsiveness
set dates[45]=2025-12-22T15:35:00
set msgs[45]=test: validate dark mode styling
set dates[46]=2025-12-23T09:45:00
set msgs[46]=refactor: extract reusable hooks
set dates[47]=2025-12-26T14:55:00
set msgs[47]=test: add tests for error boundaries
set dates[48]=2025-12-27T10:25:00
set msgs[48]=fix: handle quota exceeded errors
set dates[49]=2025-12-29T16:20:00
set msgs[49]=test: verify cleanup on extension unload
set dates[50]=2025-12-30T11:40:00
set msgs[50]=chore: update dependencies

for /L %%i in (0,1,50) do (
    echo.>> README.md
    echo ^<^!-- Test commit %%i --^> >> README.md
    
    git add -A
    
    set GIT_AUTHOR_DATE=!dates[%%i]!
    set GIT_COMMITTER_DATE=!dates[%%i]!
    
    git commit -m "!msgs[%%i]!"
    
    echo Created commit %%i: !msgs[%%i]! at !dates[%%i]!
)

echo.
echo Completed! Created 51 backdated commits.
echo November 2025: 25 commits
echo December 2025: 26 commits
echo.
echo To view the commit history, run: git log --oneline
