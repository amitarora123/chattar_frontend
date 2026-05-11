import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    rules: {
      "no-unused-vars": "off", // disabled in favour of the TS-aware rule below
      "@typescript-eslint/no-unused-vars": "warn", // warn only, never blocks commit
    },
  },
]);

export default eslintConfig;
