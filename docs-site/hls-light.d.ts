/*
 * Types for hls.js's light build.
 *
 * The package ships declarations for its main entry but names none for
 * `./light`, so TypeScript sees `any` and `noImplicitAny` rejects it. The
 * two builds export the same `Hls` class — light simply registers fewer
 * controllers (no subtitles, alternate audio or DRM) — so pointing one at
 * the other's types is accurate rather than a convenient lie.
 *
 * If a later hls.js adds its own `types` to that export, delete this.
 */
declare module "hls.js/light" {
  export * from "hls.js";
  export { default } from "hls.js";
}
