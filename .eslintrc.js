// TODO: These rules should be enabled, but we had offenses when we enabled ESLint.
// This is tech-debt. We should go through and re-enable these at some point.
const temporarilyDisabledRules = {
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
        'off',
        {
            argsIgnorePattern: '^_', // Ignore argument variables starting with _
            varsIgnorePattern: '^_' // Ignore local variables starting with _
        }
    ], // 26 problems
    '@typescript-eslint/no-var-requires': 'off',
    'no-constant-condition': 'off',
    'no-undef': 'off',
    'no-var': 'off',
    'prefer-const': 'off'
};

module.exports = {
    env: {
        es2021: true,
        node: true
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier'
    ],
    overrides: [
        {
            env: {
                node: true
            },
            files: ['.eslintrc.{js,cjs}'],
            parserOptions: {
                sourceType: 'script'
            }
        }
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    plugins: ['@typescript-eslint', 'simple-import-sort'],
    rules: {
        'simple-import-sort/exports': 'error',
        'simple-import-sort/imports': 'error',
        ...temporarilyDisabledRules
    }
};
