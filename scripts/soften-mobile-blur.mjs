import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === ".git") continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(js|jsx|css)$/.test(name)) out.push(p);
  }
  return out;
}

const replacements = [
  ["blur-[140px]", "blur-2xl md:blur-[140px] opacity-50 md:opacity-100"],
  ["blur-[130px]", "blur-2xl md:blur-[130px] opacity-50 md:opacity-100"],
  ["blur-[120px]", "blur-xl md:blur-[120px] opacity-45 md:opacity-100"],
  ["blur-[110px]", "blur-xl md:blur-[110px] opacity-45 md:opacity-100"],
  ["blur-[100px]", "blur-xl md:blur-[100px] opacity-40 md:opacity-100"],
];

let changed = 0;
for (const f of walk("src")) {
  let t = readFileSync(f, "utf8");
  let n = t;
  for (const [from, to] of replacements) {
    if (n.includes(to)) continue; // already softened
    n = n.split(from).join(to);
  }
  if (n !== t) {
    writeFileSync(f, n);
    changed += 1;
    console.log("updated", f);
  }
}
console.log("filesChanged", changed);
