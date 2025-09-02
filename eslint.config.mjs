import reactHooks from 'eslint-plugin-react-hooks';
import typescriptEslint from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: [
      "node_modules/",
      ".next/",
      "lib/generated/prisma/",
    ],
  },
  {
    plugins: {
      "react-hooks": reactHooks,
      "@typescript-eslint": typescriptEslint,
    },
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
];






