# Tutorial video: encode, upload, embed

The docs serve video themselves rather than embedding YouTube, because the
networks this documentation is read on block it. Self-hosting brings its own
problem — a single file has a single bitrate, so a reader on a poor
connection waits for exactly the bytes a reader on fibre gets — which is why
the recording is cut into three renditions and streamed.

Storage is a Cloudflare R2 bucket. Not this repository: a re-encode replaces
every segment at once and git keeps all of them forever. R2 charges nothing
for egress, which is the line item that usually argues against self-hosting.

---

## 1. Encode

```bash
cd docs-site
node scripts/encode-video.mjs ~/recording.mp4 mcp-server
```

Needs `ffmpeg` on PATH (`winget install Gyan.FFmpeg`, or `brew install ffmpeg`).

It writes `public/video/mcp-server/`:

```
master.m3u8          which renditions exist
v0/ v1/ v2/          1080p, 720p, 480p — playlist plus 4-second segments
fallback.mp4         one bitrate, for anything that cannot play HLS
```

Add a `poster.jpg` beside them — a frame from the video, and the only thing
the page loads before someone presses play.

## 2. Make the bucket public

**The S3 endpoint is not the public URL.**
`<account>.r2.cloudflarestorage.com/kit-tutorial` takes signed requests and
will refuse a video player. You need one of:

- **A custom domain** — R2 → your bucket → Settings → Custom Domains. Gives
  `video.gramproindia.com`, Cloudflare's CDN and cache control. Do this for
  anything you expect people to watch.
- **The r2.dev development URL** — same page, "Public Development URL".
  Gives `https://pub-<hash>.r2.dev`. Rate-limited and not meant for
  production, but fine while you are trying this out.

## 3. Allow the docs site to read it

A player fetches the playlist and every segment with `fetch`, so the browser
applies CORS. Without a policy the video fails with nothing useful in the
console. R2 → your bucket → Settings → CORS policy:

```json
[
  {
    "AllowedOrigins": [
      "https://kit.gramproindia.com",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["Range"],
    "ExposeHeaders": ["Content-Length", "Content-Range"],
    "MaxAgeSeconds": 86400
  }
]
```

`Range` matters: the fallback MP4 is played by seeking into it, and a
browser cannot do that if the header is not allowed through.

## 4. Upload

The bucket speaks S3, so any S3 client works. With rclone:

```bash
rclone copy public/video/mcp-server \
  r2:kit-tutorial/mcp-server \
  --header-upload "Cache-Control: public, max-age=31536000, immutable"
```

Segments never change once written — a new encode writes new names — so they
can be cached forever. The two playlists should not be:

```bash
rclone copy public/video/mcp-server/master.m3u8 r2:kit-tutorial/mcp-server \
  --header-upload "Cache-Control: public, max-age=300"
```

Getting this backwards is the common mistake: a cached-forever playlist means
a re-encode never reaches anyone.

## 5. Point the site at it

`.env.local`, and the same variable in Vercel's project settings:

```
NEXT_PUBLIC_VIDEO_BASE=https://video.gramproindia.com
```

Unset, it falls back to `/video`, so a checkout with no bucket configured
plays whatever is in `public/video` and nothing breaks.

## 6. Embed

```mdx
<SelfHostedVideo name="mcp-server" title="The MCP server in five minutes" />
```

The page renders a poster and a button. `hls.js` is fetched by the click, and
only where it is needed — Safari plays HLS natively and never downloads it.
If that fetch fails, the player falls back to `fallback.mp4` and says so.

---

## Checking it worked

Open the page, press play, and watch the network panel:

- before the click: one image, nothing else
- on the click: a ~90 KB (gzipped) player chunk, then `master.m3u8`
- then: segments, four seconds at a time, from the rendition your connection
  can manage. Throttle to Slow 3G and it should pick `v2` and keep playing
  rather than stall.

If the video does not start, check CORS first — it is nearly always CORS.
