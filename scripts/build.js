import { access, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const dist = "dist";
await rm(dist, { recursive: true, force: true });
await mkdir(join(dist, "src", "core"), { recursive: true });

const files = [
  "index.html",
  "server.js",
  "package.json",
  "src/app.js",
  "src/styles.css",
  "src/core/automationEngine.js",
  "src/storage/supabaseStore.js",
  "supabase/migrations/001_initial_schema.sql"
];

for (const file of files) {
  const target = join(dist, file);
  const folder = target.slice(0, target.lastIndexOf("/"));
  await mkdir(folder, { recursive: true });
  await writeFile(target, await readFile(file));
}

for (const file of await listJavaScriptFiles(join("dist", "src", "core"))) {
  await import(`../${file}?check=${Date.now()}`);
}

await access(join(dist, "index.html"));
console.log("Build artifact created in dist/");

async function listJavaScriptFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listJavaScriptFiles(path)));
    } else if (entry.name.endsWith(".js") && !path.endsWith("app.js")) {
      files.push(path);
    }
  }

  return files;
}
