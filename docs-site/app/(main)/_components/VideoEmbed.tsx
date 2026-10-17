"use client";

import { useState } from "react";

/*
 * A video that costs nothing until someone presses play.
 *
 * A YouTube iframe pulls roughly a megabyte of player JavaScript whether or
 * not the video is watched, which on a slow connection delays the page a
 * reader came for. So what renders first is a poster and a button — one
 * image — and the iframe is created on the click that asks for it.
 *
 * The other half of "works on a slow connection" is the stream itself, and
 * that is why this embeds rather than self-hosts. An MP4 served from our own
 * origin has one bitrate: a reader on a poor connection waits for the same
 * bytes everyone else gets. YouTube transcodes to several and switches
 * between them mid-playback, which is the part that is genuinely hard to
 * build and the reason to accept someone else's player.
 *
 * nocookie.com is the no-tracking-until-playback host; it behaves the same.
 */

interface VideoEmbedProps {
  /** The YouTube id — the v= part of the URL. */
  id: string;
  /** Said aloud by screen readers, and shown if the poster fails to load. */
  title: string;
  /**
   * A poster of your own, served from this site. Without one the thumbnail
   * comes from YouTube: `hq` rather than `maxres`, because this is a preview
   * that may never be clicked and 60 KB beats 300 KB for that.
   */
  poster?: string;
}

export function VideoEmbed({ id, title, poster }: VideoEmbedProps) {
  const [playing, setPlaying] = useState(false);
  const thumbnail = poster ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  return (
    <div className="v2-video">
      {playing ? (
        <iframe
          className="v2-video-frame"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          className="v2-video-poster"
          onClick={() => setPlaying(true)}
          aria-label={`Play: ${title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbnail} alt="" loading="lazy" decoding="async" />
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
