@echo off
title Add Song to OBS Playlist
cd /d "%~dp0"

echo Starting downloader...
node download-song.mjs

echo.
pause