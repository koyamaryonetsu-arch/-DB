@echo off
rem Kizuna no Monsho - family server (Windows)
chcp 65001 > nul
cd /d "%~dp0"
where node > nul 2> nul
if errorlevel 1 (
  echo Node.js is not installed. Please install the LTS version from https://nodejs.org/ja
  pause
  exit /b 1
)
node server\index.js
if errorlevel 1 (
  rem The server stopped with an error: look for a fixed version on GitHub, then start again
  node server\rescue.js
  if not errorlevel 1 node server\index.js
)
pause
