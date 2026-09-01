import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Allow classic data-fetch-on-mount patterns; React Compiler rule is too
      // strict for our App Router client pages (fetch + setState in effects).
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
