import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import vue from "eslint-plugin-vue";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      "pnpm-lock.yaml",
      "scripts/seed/*.md",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["apps/web/**/*"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ["apps/web/src/pages/**/*.vue"],
    rules: {
      "vue/multi-word-component-names": "off",
    },
  },
  prettier,
);
