@echo off
rem Kizuna no Monsho - stop opening the family server from outside
chcp 65001 > nul
cd /d "%~dp0"
node server\funnel-cli.js off
pause
