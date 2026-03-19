@echo off
title Update Music Playlist
cd /d "%~dp0"
node generate-playlist.mjs
pause