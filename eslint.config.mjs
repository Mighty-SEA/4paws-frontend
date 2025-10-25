import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { ignores: [".github/", ".husky/", "node_modules/", ".next/**", "scripts/", "src/components/ui", "*.config.ts", "*.mjs", "ecosystem.config.js", "dist/", "build/", "*.d.ts", "public/"] },
  {
    languageOptions: {
      globals: globals.browser,
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      prettier: prettier,
      react: pluginReact,
    },
  },
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "prettier/prettier": [
        "warn",
        {
          endOfLine: "auto",
        },
      ],
      "no-trailing-spaces": "warn",
      "no-multiple-empty-lines": ["warn", { max: 1, maxEOF: 1 }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn"],
      "react/jsx-pascal-case": "warn",
      "react/no-unstable-nested-components": ["warn", { allowAsProps: true }],
      "react/no-array-index-key": "warn",
    },
  },
];
