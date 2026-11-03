#!/usr/bin/env node
/*
 * Tell search engines that use IndexNow (Bing, which ChatGPT search reads;
 * Yandex, Seznam, Naver) about the site's pages, straight after a deploy.
 *
 *   node scripts/indexnow.mjs              every URL in the live sitemap
 *   node scripts/indexnow.mjs --native     only the React Native pages
 *   node scripts/indexnow.mjs --dry-run    print what would be sent
 *
 * Needs the key file public/<KEY>.txt to be deployed first: IndexNow fetches
 * https://kit.gramproindia.com/<KEY>.txt to prove the site is ours.
 */
const SITE = "https://kit.gramproindia.com";
const KEY = "75324856c2512bcaf3f871256d60d958";
const ENDPOINT = "https://api.indexnow.org/indexnow";

const args = new Set(process.argv.slice(2));
const nativeOnly = args.has("--native");
const dryRun = args.has("--dry-run");

async function sitemapUrls() {
  const res = await fetch(`${SITE}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap: HTTP ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function main() {
  const keyCheck = await fetch(`${SITE}/${KEY}.txt`);
  if (!keyCheck.ok || (await keyCheck.text()).trim() !== KEY) {
    throw new Error(`The key file ${SITE}/${KEY}.txt is not live yet. Deploy first.`);
  }

  let urls = await sitemapUrls();
  if (nativeOnly) urls = urls.filter((u) => u.startsWith(`${SITE}/native`));
  if (urls.length === 0) throw new Error("No URLs to submit.");

  // IndexNow takes up to 10,000 URLs per request.
  const body = { host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls.slice(0, 10000) };
  console.log(`${dryRun ? "Would submit" : "Submitting"} ${body.urlList.length} URL(s)${nativeOnly ? " (React Native pages)" : ""}.`);
  if (dryRun) {
    for (const u of body.urlList) console.log(`  ${u}`);
    return;
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  // 200 and 202 both mean accepted; 202 = key validation still pending.
  console.log(`IndexNow answered HTTP ${res.status}${res.ok ? " (accepted)" : ""}.`);
  if (!res.ok) {
    console.log(await res.text());
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
