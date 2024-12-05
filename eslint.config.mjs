import js from '@eslint/js';
import ts from 'typescript-eslint';

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
        },
    }
);
