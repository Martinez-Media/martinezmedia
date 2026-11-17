import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("_site");
const origin = "https://www.martinezmedia.net";
const routes = [
  "/", "/products/", "/products/wavewrangler/", "/about/",
  "/past-work/", "/support/", "/privacy/",
];

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(file) : file;
  }));
  return files.flat();
}

for (const required of ["index.html", "styles.css", "theme.js", "images", "robots.txt", "sitemap.xml", "CNAME"]) {
  await stat(path.join(root, required));
}
assert.equal(await readFile(path.join(root, "CNAME"), "utf8"), await readFile("CNAME", "utf8"));

const files = (await filesIn(root)).filter((file) => file.endsWith(".html"));
assert.equal(files.length, routes.length, "Unexpected number of HTML pages");
const documents = new Map(await Promise.all(files.map(async (file) => [file, await readFile(file, "utf8")])));
let links = 0;
for (const [file, html] of documents) {
  const route = `/${path.relative(root, path.dirname(file)).split(path.sep).filter(Boolean).join("/")}`;
  const url = new URL(route === "/" ? "/" : `${route}/`, origin);
  assert(routes.includes(url.pathname), `Unexpected route ${url.pathname}`);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${file}: expected one h1`);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<meta name="viewport"/);
  assert.match(html, /<meta name="description" content="[^"]+"/);
  assert.match(html, /href="#main"/);
  assert.match(html, /id="main"/);
  assert(html.includes(`<link rel="canonical" href="${url.href}"`), `${file}: incorrect canonical`);
  assert(!/dissolutionDate|mostly idle|wound the LLC down|business is idle/i.test(html), `${file}: stale company claim`);
  assert.equal((html.match(/<script src="\/theme\.js"><\/script>/g) ?? []).length, 1, `${file}: expected one theme enhancement`);
  assert(html.indexOf('<script src="/theme.js">') < html.indexOf('<link rel="stylesheet"'), `${file}: restore preference before CSS paints`);
  assert.match(html, /data-theme-control hidden>Appearance <select name="theme"><option value="system">System<\/option><option value="light">Light<\/option><option value="dark">Dark<\/option><\/select>/);
  for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (script[1] === ' src="/theme.js"' && script[2] === "") continue;
    assert.match(script[1], /^\s+type="application\/ld\+json"\s*$/, `${file}: only theme enhancement and structured data are allowed`);
    JSON.parse(script[2]);
  }
  for (const image of html.matchAll(/<img\b[^>]*>/g)) {
    assert.match(image[0], /\balt="[^"]*"/, `${file}: missing image alt`);
    assert.match(image[0], /\bwidth="\d+"/);
    assert.match(image[0], /\bheight="\d+"/);
  }
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = new URL(match[1].replaceAll("&amp;", "&"), url);
    if (target.origin !== origin) continue;
    const localPath = path.join(root, decodeURIComponent(target.pathname));
    const destination = target.pathname.endsWith("/") ? path.join(localPath, "index.html") : localPath;
    await stat(destination).catch((error) => {
      throw new Error(`${file}: broken local URL ${match[1]}`, { cause: error });
    });
    if (target.hash) {
      const document = documents.get(destination);
      assert(document?.includes(`id="${decodeURIComponent(target.hash.slice(1))}"`), `${file}: missing anchor ${match[1]}`);
    }
    links++;
  }
}
const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]).sort();
assert.deepEqual(locations, routes.map((route) => `${origin}${route}`).sort());
console.log(`Checked ${files.length} pages, ${links} local references, sitemap coverage, metadata, image markup, and JS-free rendering structure.`);
