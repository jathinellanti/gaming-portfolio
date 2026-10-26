// Narrow, bug-driven lint (owner rule): undefined/use-before-define, hooks, and the
// architecture's import boundaries. Style is not linted.
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

const NO_3D_ON_SITE = {
  group: ["three", "three/*", "@react-three/*"],
  message: "No 3D on the professional site's eager path (ARCHITECTURE.md invariant 6). Load it via lazy() from a game or Diorama module.",
};

export default [
  { ignores: ["dist", "node_modules", "playwright-report", "test-results", "logs"] },
  {
    files: ["**/*.js"],
    ...js.configs.recommended,
    languageOptions: { globals: globals.node },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { "react-hooks": reactHooks, "@typescript-eslint": tseslint.plugin },
    rules: {
      // no-undef is enforced by the TypeScript compiler for .ts/.tsx (typescript-eslint guidance).
      "@typescript-eslint/no-use-before-define": ["error", { functions: false, classes: true, variables: true }],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },
  {
    files: ["src/site/**/*.{ts,tsx}", "src/content/**/*.{ts,tsx}", "src/platform/**/*.{ts,tsx}", "src/play/**/*.{ts,tsx}", "src/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", { patterns: [NO_3D_ON_SITE] }] },
  },
  {
    files: ["src/games/block/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", { patterns: [{ group: ["**/games/neon/**", "**/games/city/**"], message: "Games never import each other (invariant 2)." }] }] },
  },
  {
    files: ["src/games/neon/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", { patterns: [{ group: ["**/games/block/**", "**/games/city/**"], message: "Games never import each other (invariant 2)." }] }] },
  },
  {
    files: ["src/games/city/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", { patterns: [{ group: ["**/games/block/**", "**/games/neon/**"], message: "Games never import each other (invariant 2)." }] }] },
  },
];
