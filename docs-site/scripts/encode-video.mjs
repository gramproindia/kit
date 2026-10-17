/*
 * Turn one recording into an adaptive stream the docs can serve themselves.
 *
 *   node scripts/encode-video.mjs recording.mp4 mcp-server
 *
 * Writes public/video/mcp-server/ : a master playlist, three renditions, and
 * a progressive MP4 for anything that cannot play HLS at all.
 *
 * Why not one MP4. A single file has a single bitrate, so a reader on a poor
 * connection waits for exactly the bytes a reader on fibre gets, and stalls.
 * HLS cuts each rendition into segments and the player moves between them
 * mid-playback: a slow connection starts at 480p and climbs, rather than
 * buffering at 1080p. That is the whole of "works on a bad network", and it
 * is why this is worth an encode step.
 *
 * The ladder is tuned for a screencast rather than video: text legibility
 * matters more than motion, so the resolutions stay high and the bitrates
 * stay low. A talking head would want the opposite.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, statSync, readdirSync } from "node:fs";
import path from "node:path";

const [source, name] = process.argv.slice(2);

if (!source || !name) {
  console.log("Usage: node scripts/encode-video.mjs <source.mp4> <name>");
  console.log("  e.g. node scripts/encode-video.mjs recording.mp4 mcp-server");
  process.exit(1);
}

if (!existsSync(source)) {
  console.log(`No file at ${path.resolve(source)}`);
  process.exit(1);
}

try {
  execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
} catch {
  console.log("ffmpeg is not on PATH. It does the encoding; this script only drives it.");
  console.log("  winget install Gyan.FFmpeg     (Windows)");
  console.log("  brew install ffmpeg            (macOS)");
  process.exit(1);
}

const out = path.resolve("public", "video", name);
mkdirSync(out, { recursive: true });

/*
 * Four seconds a segment, with a keyframe at every boundary.
 *
 * Shorter segments switch rendition sooner, which is what a reader on a
 * fluctuating connection feels; longer ones compress slightly better. Four is
 * the usual compromise. The keyframe interval has to divide it exactly or a
 * player cannot cut cleanly, which shows up as a freeze on every switch.
 */
const SEGMENT = 4;
const FPS = 30;
const KEY = SEGMENT * FPS;

/** height, video bitrate, maximum rate, buffer, audio bitrate */
const LADDER = [
  { h: 1080, v: "2400k", max: "2600k", buf: "3600k", a: "128k" },
  { h: 720, v: "1200k", max: "1300k", buf: "1800k", a: "96k" },
  { h: 480, v: "500k", max: "550k", buf: "750k", a: "64k" },
];

const args = ["-y", "-i", source];

for (let i = 0; i < LADDER.length; i += 1) {
  const { h, v, max, buf, a } = LADDER[i];
  args.push(
    "-map", "0:v:0", "-map", "0:a:0?",
    `-filter:v:${i}`, `scale=-2:${h}`,
    `-c:v:${i}`, "libx264",
    `-b:v:${i}`, v,
    `-maxrate:v:${i}`, max,
    `-bufsize:v:${i}`, buf,
    `-preset:v:${i}`, "slow",
    `-profile:v:${i}`, "high",
    `-c:a:${i}`, "aac",
    `-b:a:${i}`, a,
  );
}

args.push(
  "-g", String(KEY),
  "-keyint_min", String(KEY),
  "-sc_threshold", "0",
  "-var_stream_map", LADDER.map((_, i) => `v:${i},a:${i}`).join(" "),
  "-f", "hls",
  "-hls_time", String(SEGMENT),
  "-hls_playlist_type", "vod",
  // One directory per rendition, so the segment names cannot collide.
  "-hls_segment_filename", path.join(out, "v%v", "segment%03d.ts"),
  "-master_pl_name", "master.m3u8",
  path.join(out, "v%v", "playlist.m3u8"),
);

for (const i of LADDER.keys()) mkdirSync(path.join(out, `v${i}`), { recursive: true });

console.log(`Encoding ${source} -> public/video/${name}/`);
console.log(`  ${LADDER.map((l) => l.h + "p").join(", ")}, ${SEGMENT}s segments`);
execFileSync("ffmpeg", args, { stdio: "inherit" });

/*
 * A progressive fallback.
 *
 * hls.js covers every browser that lacks native HLS, but it is JavaScript and
 * it can be blocked, fail or be switched off. One ordinary MP4 means the
 * video still plays when it does, at one bitrate, which is worse than
 * adaptive and far better than nothing.
 */
console.log("Encoding the progressive fallback");
execFileSync(
  "ffmpeg",
  [
    "-y", "-i", source,
    "-vf", "scale=-2:720",
    "-c:v", "libx264", "-b:v", "1200k", "-preset", "slow", "-profile:v", "high",
    "-c:a", "aac", "-b:a", "96k",
    // Moves the index to the front so playback starts before the whole file
    // has arrived, which on a slow connection is the difference between
    // "starts in a second" and "starts when it finishes".
    "-movflags", "+faststart",
    path.join(out, "fallback.mp4"),
  ],
  { stdio: "inherit" },
);

/* -------------------------------------------------------------- report */

const sizeOf = (dir) =>
  readdirSync(dir, { withFileTypes: true }).reduce((total, entry) => {
    const p = path.join(dir, entry.name);
    return total + (entry.isDirectory() ? sizeOf(p) : statSync(p).size);
  }, 0);

const mb = (n) => (n / 1024 / 1024).toFixed(1) + " MB";
console.log("");
console.log(`Wrote public/video/${name}/  ${mb(sizeOf(out))}`);
for (const i of LADDER.keys()) {
  console.log(`  v${i}  ${String(LADDER[i].h) + "p"}  ${mb(sizeOf(path.join(out, `v${i}`)))}`);
}
console.log(`  fallback.mp4  ${mb(statSync(path.join(out, "fallback.mp4")).size)}`);
console.log("");
console.log("These are large binaries. Track them with Git LFS before committing:");
console.log("  git lfs track \"docs-site/public/video/**\"");
console.log("");
console.log(`Then in MDX:  <SelfHostedVideo name="${name}" title="..." />`);
