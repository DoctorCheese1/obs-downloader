import fs from "fs";
import path from "path";
import readline from "readline";
import { spawn } from "child_process";

const rootDir = process.cwd();
const songsDir = path.resolve(rootDir, "songs");
const downloadsDir = path.resolve(rootDir, "downloads");
const playlistScript = path.resolve(rootDir, "generate-playlist.mjs");

if (!fs.existsSync(songsDir)) fs.mkdirSync(songsDir, { recursive: true });
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, answer => resolve(answer.trim())));
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      ...options
    });

    child.on("error", reject);
    child.on("close", code => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

function sanitizeBaseName(name) {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function normalizeMediaUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);

    // Playlist context params are optional for single-track downloads and
    // can cause command-line issues in shell-based environments.
    parsed.searchParams.delete("list");
    parsed.searchParams.delete("index");
    parsed.searchParams.delete("pp");
    parsed.searchParams.delete("si");

    // Keep only the video id for /watch URLs.
    if (parsed.hostname.includes("youtube.com") && parsed.pathname === "/watch") {
      const videoId = parsed.searchParams.get("v");
      if (!videoId) return rawUrl;

      parsed.search = "";
      parsed.searchParams.set("v", videoId);
    }

    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

async function main() {
  console.log("OBS Music Downloader");
  console.log("--------------------");
  console.log("Paste a supported URL you are allowed to use.");
  console.log("");

  const urlInput = await ask("URL: ");
  if (!urlInput) {
    console.log("No URL entered.");
    rl.close();
    process.exit(0);
  }
  const url = normalizeMediaUrl(urlInput);
  if (url !== urlInput) {
    console.log("Detected extra URL parameters; using cleaned single-track URL.");
  }

  const customName = await ask("Custom file name (optional): ");
  rl.close();

  const outputTemplate = customName
    ? path.join(songsDir, `${sanitizeBaseName(customName)}.%(ext)s`)
    : path.join(songsDir, "%(title)s.%(ext)s");

  const ytdlpArgs = [
    url,
    "--no-playlist",
    "--extract-audio",
    "--audio-format", "mp3",
    "--audio-quality", "0",
    "--embed-metadata",
    "--windows-filenames",
    "--restrict-filenames",
    "--no-overwrites",
    "-o", outputTemplate
  ];

  console.log("");
  console.log("Downloading and converting audio...");
  console.log("Note: conversion starts automatically after the download completes.");
  console.log("Please wait for the final \"Done\" message before closing this window.");
  console.log("");

  try {
    await run("yt-dlp", ytdlpArgs);
  } catch (err) {
    console.error("");
    console.error("Download failed.");
    console.error("Make sure yt-dlp is installed and ffmpeg is available in PATH.");
    console.error(err.message);
    process.exit(1);
  }

  console.log("");
  console.log("Rebuilding playlist...");
  console.log("");

  try {
    await run("node", [playlistScript]);
  } catch (err) {
    console.error("Playlist rebuild failed:", err.message);
    process.exit(1);
  }

  console.log("");
  console.log("Done. Your new track should now be in songs/ and playlist.json.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
