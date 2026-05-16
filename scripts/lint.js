import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const roots = ["server.js", "src", "scripts", "test"];
const errors = [];

for (const root of roots) {
  await inspectPath(root);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Lint checks passed");

async function inspectPath(path) {
  if (path.endsWith(".js")) {
    await inspectFile(path);
    return;
  }

  const entries = await readdir(path, { withFileTypes: true });
  for (const entry of entries) {
    const childPath = join(path, entry.name);
    if (entry.isDirectory()) {
      await inspectPath(childPath);
    } else if (entry.name.endsWith(".js")) {
      await inspectFile(childPath);
    }
  }
}

async function inspectFile(path) {
  const source = await readFile(path, "utf8");

  if (/\t/.test(source)) {
    errors.push(`${path}: tabs are not allowed`);
  }

  if (/[ \t]$/m.test(source)) {
    errors.push(`${path}: trailing whitespace found`);
  }

  if (source.includes("console.log") && path !== "server.js" && path !== "scripts/lint.js" && path !== "scripts/build.js") {
    errors.push(`${path}: avoid console.log in app code`);
  }

  if (!source.endsWith("\n")) {
    errors.push(`${path}: missing final newline`);
  }
}
