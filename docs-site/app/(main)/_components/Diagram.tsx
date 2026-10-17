/*
 * An architecture diagram, rendered by scripts/build-diagrams.mjs.
 *
 * A webp is a raster, so unlike the rest of this site it cannot follow the
 * theme switch: the colours are baked in. Each diagram is therefore built
 * twice and both are shipped, with CSS showing whichever matches. That costs
 * a second request only in the sense that the hidden one is never fetched —
 * `loading="lazy"` plus `display: none` means a browser skips it.
 *
 * `alt` is not decoration here. These pages are also served as Markdown for
 * models to read, and a picture is worth nothing in that copy: the alt text
 * is the diagram, as far as a screen reader or an LLM is concerned. Write it
 * as a description of what the diagram says, not as a label for it.
 */
interface DiagramProps {
  /** Base name under public/diagrams, without the -light/-dark suffix. */
  name: string;
  /** What the diagram says, in a sentence or two. Carried into the Markdown copy. */
  alt: string;
  /** Shown under the image, for the point a reader should take away. */
  caption?: string;
}

export function Diagram({ name, alt, caption }: DiagramProps) {
  return (
    <figure className="v2-diagram">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="v2-diagram-light"
        src={`/diagrams/${name}-light.webp`}
        alt={alt}
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="v2-diagram-dark"
        src={`/diagrams/${name}-dark.webp`}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
      />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
