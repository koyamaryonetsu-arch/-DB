@echo off
rem Kizuna no Monsho - open the family server from outside (Tailscale Funnel)
chcp 65001 > nul
cd /d "%~dp0"
node server\funnel-cli.js on
pause
