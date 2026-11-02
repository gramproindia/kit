// Writes Node's answers (V8, full ICU) to expected.json, the baseline the
// phone is compared against. Run: npx tsx spikes/intl/expected.ts
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { runAll } from "./checks";

const results = runAll();
results["runtime"] = `node ${process.version}, ICU ${process.versions.icu}`;
writeFileSync(join(__dirname, "expected.json"), JSON.stringify(results, null, 2) + "\n");
console.log(`wrote ${Object.keys(results).length} values`);
