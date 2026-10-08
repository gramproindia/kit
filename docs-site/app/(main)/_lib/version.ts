import { v2Config } from "./config";

const REGISTRY = "https://registry.npmjs.org/@grampro/kit/latest";

/** An hour: long enough to be free, short enough that a release shows up. */
const REVALIDATE_SECONDS = 3600;

/**
 * The version the registry is serving.
 *
 * The badge in the header used to be a number typed into a config file, and
 * it drifted -- the site read 2.3.0 while `npx @grampro/kit` installed 2.4.0.
 * Asking npm means the badge says what a reader would actually get.
 *
 * Fetched on the server and revalidated hourly, so a publish appears without
 * a redeploy and no reader pays for the request. The built-in version is the
 * fallback: a registry that is slow, rate-limiting or down must not take a
 * page down with it, and that version is itself stamped from the library's
 * own package.json at build time, so it is never more than a release behind.
 */
export async function getPublishedVersion(): Promise<string> {
  try {
    const response = await fetch(REGISTRY, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) return v2Config.version;

    const body: unknown = await response.json();
    const version =
      typeof body === "object" && body !== null
        ? (body as { version?: unknown }).version
        : undefined;

    return typeof version === "string" && version ? version : v2Config.version;
  } catch {
    return v2Config.version;
  }
}
