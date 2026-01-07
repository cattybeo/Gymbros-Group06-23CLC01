import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import unusedImportsPlugin from "eslint-plugin-unused-imports";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    ignores: [
      "**/node_modules/**",
      "**/.expo/**",
      "**/android/**",
      "**/ios/**",
      "**/dist/**",
      "**/artifacts/**",
    ],
  },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2021,
        // Deno globals for Supabase functions
        Deno: "readonly",
        // React Native globals
        __DEV__: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "unused-imports": unusedImportsPlugin,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/react-in-jsx-scope": "off",
      "no-undef": "off", // TypeScript already handles this better
    },
  },
];
