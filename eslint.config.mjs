import js from '@eslint/js';
import ts from 'typescript-eslint';
import imports from 'eslint-plugin-import';

export default ts.config(
    js.configs.recommended,
    ...ts.configs.strictTypeChecked,
    ...ts.configs.stylisticTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        rules: {
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/array-type': [
                'error',
                {
                    default: 'array-simple',
                    readonly: 'array-simple',
                },
            ],
            '@typescript-eslint/restrict-template-expressions': 'off',
            '@typescript-eslint/no-confusing-void-expression': [
                'error',
                {
                    ignoreArrowShorthand: true,
                    ignoreVoidOperator: true,
                },
            ],
            '@typescript-eslint/require-await': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/prefer-nullish-coalescing': [
                'error',
                {
                    ignorePrimitives: true,
                },
            ],
            '@typescript-eslint/no-unnecessary-condition': 'off',
            '@typescript-eslint/consistent-type-exports': 'error',
            '@typescript-eslint/consistent-type-imports': 'error',
        },
    },
    {
        plugins: {
            import: imports,
        },
        rules: {
            'import/no-empty-named-blocks': 'error',
            'import/no-amd': 'error',
            'import/no-commonjs': 'error',
            'import/no-absolute-path': 'error',
            'import/no-relative-packages': 'error',
            'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
            'import/order': [
                'error',
                {
                    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
                    pathGroups: [
                        {
                            pattern: '@oniichan/**',
                            group: 'internal',
                            position: 'before',
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ['packages/web/**', 'packages/web-host/**'],
        rules: {
            '@typescript-eslint/no-misused-promises': 'off',
        },
    }
);
