@echo off
title OBS Music Player Setup
cd /d "%~dp0"

if not exist songs mkdir songs
if not exist downloads mkdir downloads

echo Generating playlist...
node generate-playlist.mjs

echo.
echo Done.
pause