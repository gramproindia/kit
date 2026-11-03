// Common util functions

/**
 * GET JSON from `apiURl`. Resolves to undefined when the request fails, the
 * server answers with an error status, or the request is aborted, so callers
 * read a missing result rather than an error page parsed as data.
 */
export async function getSourceData(apiURl: any, init?: RequestInit) {
  try {
    const res = await fetch(apiURl, init);
    if (!res.ok) {
      console.error("Error Fetching Data", `${res.status} ${res.statusText}`.trim());
      return undefined;
    }
    const data = await res.json();
    return data;
  } catch (error) {
    // An abort is the caller moving on to a newer request, not a failure.
    if ((error as { name?: string } | null)?.name !== "AbortError") {
      console.error("Error Fetching Data", error);
    }
    return undefined;
  }
}
