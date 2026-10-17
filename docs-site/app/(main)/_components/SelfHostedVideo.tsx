"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/site.config";

interface SelfHostedVideoProps {
  /**
   * An adaptive ladder: the folder the encode script wrote, under the
   * configured video base. Use this or `src`.
   */
  name?: string;
  /**
   * One file, played directly. No playlist, no hls.js, nothing to adapt
   * between — right for a single MP4 that is already faststart.
   */
  src?: string;
  title: string;
  /**
   * A still to show before playback. Optional: without one the page draws
   * a placeholder rather than fetching a frame, which would mean pulling
   * part of the video to decorate a button nobody has pressed.
   */
  poster?: string;
}

export function SelfHostedVideo({ name, src, title, poster }: SelfHostedVideoProps) {
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  // Absolute when the bucket is configured, site-relative when it is not.
  const base = `${siteConfig.videoBase}/${name}`;
  const image = poster ?? (name ? `${base}/poster.jpg` : undefined);

  useEffect(() => {
    const element = video.current;
    if (!playing || !element) return;

    // One file: hand it to the browser and stay out of the way.
    if (src) {
      element.src = src;
      void element.play().catch(() => {});
      return;
    }

    // Safari and iOS play HLS directly. Loading a player for them would be
    // 40 KB spent to do what the browser already does.
    if (element.canPlayType("application/vnd.apple.mpegurl")) {
      element.src = `${base}/master.m3u8`;
      void element.play().catch(() => {});
      return;
    }

    let hls: { destroy(): void } | null = null;
    let cancelled = false;

    // Imported here rather than at the top of the file, so it is in a chunk
    // the page never fetches unless someone presses play.
    //
    // The light build, which is 377 KB against 605: what it drops is
    // subtitles, alternate audio tracks and DRM, and a screencast has
    // none of those.
    import("hls.js/light")
      .then(({ default: Hls }) => {
        if (cancelled || !video.current) return;
        if (!Hls.isSupported()) {
          // No MSE: the progressive file is the only thing that will play.
          video.current.src = `${base}/fallback.mp4`;
          void video.current.play().catch(() => {});
          return;
        }
        const instance = new Hls({ capLevelToPlayerSize: true });
        hls = instance;
        instance.loadSource(`${base}/master.m3u8`);
        instance.attachMedia(video.current);
        void video.current.play().catch(() => {});
      })
      .catch(() => {
        // Blocked, offline, or the chunk failed. One bitrate beats none.
        if (cancelled || !video.current) return;
        setFailed(true);
        video.current.src = `${base}/fallback.mp4`;
        void video.current.play().catch(() => {});
      });

    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [playing, base, src]);

  return (
    <div className="v2-video">
      {playing ? (
        <>
          <video
            ref={video}
            className="v2-video-frame"
            controls
            playsInline
            preload="none"
            poster={image}
            title={title}
          />
          {failed && (
            <p className="v2-video-note">Streaming is unavailable here, so this is a single quality.</p>
          )}
        </>
      ) : (
        <button
          type="button"
          className="v2-video-poster"
          onClick={() => setPlaying(true)}
          aria-label={`Play: ${title}`}
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" loading="lazy" decoding="async" />
          ) : (
            <span className="v2-video-blank" aria-hidden />
          )}
          <span className="v2-video-play" aria-hidden>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="v2-video-title">{title}</span>
        </button>
      )}
    </div>
  );
}
