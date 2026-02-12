import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';

export default tseslint.config(
  // Base JavaScript configuration
  js.configs.recommended,

  // Global ignores
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'build/**',
      '*.config.js',
      '*.config.mjs',
      '*.min.js',
    ],
  },

  // TypeScript files configuration
  {
    files: ['**/*.ts'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        // Node.js globals
        global: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        console: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'unused-imports': unusedImportsPlugin,
    },
    rules: {
      // ===== TypeScript Strict Type Safety =====
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unnecessary-type-arguments': 'warn',
      '@typescript-eslint/no-unnecessary-type-constraint': 'error',

      // ===== TypeScript Best Practices =====
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-readonly': 'warn',
      '@typescript-eslint/prefer-return-this-type': 'warn',
      '@typescript-eslint/prefer-string-starts-ends-with': 'warn',
      '@typescript-eslint/prefer-includes': 'warn',
      '@typescript-eslint/prefer-regexp-exec': 'warn',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-confusing-void-expression': 'error',

      // ===== Unused Imports & Variables =====
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // ===== Code Quality =====
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'prefer-destructuring': [
        'warn',
        {
          VariableDeclarator: { array: false, object: true },
          AssignmentExpression: { array: false, object: false },
        },
      ],
      'object-shorthand': 'error',
      'array-callback-return': 'error',
      'default-param-last': 'error',

      // ===== Best Practices =====
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-return-await': 'error',
      'no-param-reassign': 'error',
      'no-loop-func': 'error',
      'require-atomic-updates': 'error',
      'no-iterator': 'error',
      'no-new-wrappers': 'error',
      'no-multi-assign': 'error',
      'no-nested-ternary': 'error',
      'no-unneeded-ternary': 'error',
      'no-useless-constructor': 'off', // TypeScript handles this
      '@typescript-eslint/no-useless-constructor': 'error',
      'dot-notation': 'off',
      '@typescript-eslint/dot-notation': 'error',

      // ===== Style & Formatting =====
      'arrow-body-style': ['error', 'as-needed'],
      'arrow-spacing': 'error',
      'arrow-parens': ['error', 'always'],
      'no-confusing-arrow': 'error',
      'implicit-arrow-linebreak': 'error',
      'quote-props': ['error', 'as-needed'],
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: 'error',
      'comma-dangle': [
        'error',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'always-multiline',
          functions: 'always-multiline',
        },
      ],

      // ===== Spacing =====
      indent: ['error', 2, { SwitchCase: 1 }],
      'space-before-blocks': 'error',
      'space-before-function-paren': [
        'error',
        {
          anonymous: 'always',
          named: 'never',
          asyncArrow: 'always',
        },
      ],
      'space-in-parens': 'error',
      'space-infix-ops': 'error',
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': 'error',
      'block-spacing': 'error',
      'computed-property-spacing': 'error',
      'func-call-spacing': 'error',
      'keyword-spacing': 'error',
      'comma-spacing': 'error',
      'no-trailing-spaces': 'error',
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0, maxBOF: 0 }],
      'padded-blocks': ['error', 'never'],
      'no-whitespace-before-property': 'error',
      'eol-last': 'error',

      // ===== Structure =====
      'brace-style': ['error', '1tbs', { allowSingleLine: true }],
      'no-else-return': 'error',
      'operator-linebreak': ['error', 'before'],
      'newline-per-chained-call': ['error', { ignoreChainWithDepth: 3 }],
      'function-paren-newline': ['error', 'multiline-arguments'],
      'object-curly-newline': ['error', { consistent: true }],
      'one-var': ['error', 'never'],

      // ===== Error Prevention =====
      'no-promise-executor-return': 'error',
      'no-unreachable-loop': 'error',
      'no-unused-private-class-members': 'error',
      'require-await': 'off', // TypeScript version is better
      'no-duplicate-imports': 'off', // TypeScript handles this
      'no-case-declarations': 'error',

      // ===== Comments & Documentation =====
      'spaced-comment': ['error', 'always', { markers: ['/'] }],
      'multiline-comment-style': ['warn', 'starred-block'],

      // ===== Naming =====
      camelcase: ['error', { properties: 'never', ignoreDestructuring: false }],
      'new-cap': ['error', { capIsNewExceptions: ['Router'] }],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase'],
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'property',
          format: null, // Allow any format for properties (HTTP headers, env vars, etc.)
        },
        {
          selector: 'objectLiteralProperty',
          format: null, // Allow any format for object literal properties
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE'],
        },
      ],

      // ===== Overrides for specific patterns =====
      '@typescript-eslint/require-await': 'warn', // Warn instead of error
      '@typescript-eslint/no-unsafe-assignment': 'warn', // Warn for gradual migration
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: false, allowNullish: false },
      ],
    },
  },
);
