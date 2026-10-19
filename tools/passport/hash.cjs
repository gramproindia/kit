/*
 * The content hash a passport records as `source.sourceHash`.
 *
 * Kept on its own, with no TypeScript and no extractor behind it, because two
 * very different callers need the identical function: the passport generator,
 * which writes the hash, and the installer, which has to recompute it inside a
 * user's project to tell an untouched component from an edited one. If those
 * two ever disagreed by a byte, every installed component would read as
 * edited, and `add` would refuse to update any of them.
 *
 * Entries are hashed by label, not by where the file sits on disk. The
 * generator labels a file by its path inside this repository
 * (`source/components/button/react/Button.tsx`); the installer reads the same
 * file from `component-lib/button/react/Button.tsx` and labels it the same
 * way. Sorting by that label — rather than by absolute path, as this used to —
 * also makes the order independent of whether the OS separator is `/` or `\`.
 */
const fs = require("fs");
const crypto = require("crypto");

/**
 * @param {{ label: string, file: string }[]} entries
 * @returns {string} "sha256:<hex>"
 */
function hashEntries(entries) {
  const h = crypto.createHash("sha256");
  const sorted = [...entries].sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));
  for (const { label, file } of sorted) {
    h.update(label);
    h.update("\0");
    // Line endings normalised: the same file is CRLF on a Windows checkout
    // and LF on CI, and a content hash must not depend on how it was checked out.
    h.update(fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n"));
    h.update("\0");
  }
  return `sha256:${h.digest("hex")}`;
}

module.exports = { hashEntries };
