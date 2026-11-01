import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/features/*/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/**", "axios", "next/**", "react", "zustand"],
              message: "Domain entities must not depend on application or framework code.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/*/application/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "axios",
                "next/**",
                "react",
                "zustand",
                "@/app/**",
                "@/infrastructure/**",
                "@/features/*/composition/**",
                "@/features/*/infrastructure/**",
                "@/features/*/presentation/**",
              ],
              message: "Application use cases may depend only on application ports and domain entities.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
