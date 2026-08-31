import path from "node:path";
import { pathToFileURL } from "node:url";

const src = path.resolve(import.meta.dirname, "..", "src");

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let file = path.join(src, specifier.slice(2));
    if (!path.extname(file)) file += ".js";
    return { url: pathToFileURL(file).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
