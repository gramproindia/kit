import { v2Config } from "./config";

/**
 * The version shown in the header badge.
 *
 * This is the library's own package.json version, stamped in at build time.
 * Every release is pushed to main, and every push redeploys the site, so the
 * badge moves with the release.
 *
 * It used to ask the npm registry with an hourly revalidate. The layout calls
 * this, so that one timer made every page on the site an ISR page: each was
 * re-rendered on Vercel up to once an hour whenever a reader, a crawler or a
 * link prefetch reached it. That was nearly all of the project's Active CPU
 * use. Keep this free of fetches so every page stays a static file.
 */
export async function getPublishedVersion(): Promise<string> {
  return v2Config.version;
}
