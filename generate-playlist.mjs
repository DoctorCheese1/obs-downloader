import fs from "fs";
import path from "path";

const songsFolder = path.resolve("./songs");
const outputJson = path.resolve("./playlist.json");
const outputJs = path.resolve("./playlist.js");

const allowedExtensions = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"];

function formatTitle(filename) {
  return filename
    .replace(path.extname(filename), "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function generatePlaylist() {
  if (!fs.existsSync(songsFolder)) {
    fs.mkdirSync(songsFolder, { recursive: true });
  }

  const files = fs
    .readdirSync(songsFolder, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => entry.name)
    .filter(name => allowedExtensions.includes(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  const playlist = files.map((file, index) => ({
    id: index + 1,
    title: formatTitle(file),
    file: `songs/${file}`
  }));

  fs.writeFileSync(outputJson, JSON.stringify(playlist, null, 2), "utf8");
  fs.writeFileSync(outputJs, `window.PLAYLIST = ${JSON.stringify(playlist, null, 2)};`, "utf8");

  console.log(`Generated playlist with ${playlist.length} track(s).`);
  console.log(`Created: playlist.json`);
  console.log(`Created: playlist.js`);
}

generatePlaylist();