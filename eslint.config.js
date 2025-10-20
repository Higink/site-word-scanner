import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import globals from 'globals';


export default [
    js.configs.recommended,
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: './tsconfig.json',
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
            globals: {
                ...globals.node
            }
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            // TypeScript specific rules
            '@typescript-eslint/explicit-function-return-type': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': 'error',

            // General rules
            'eqeqeq': 'error',
            'no-unused-vars': 'off', // Désactivé en faveur de la version TypeScript
            'quotes': ['error', 'single'],
            'semi': ['error', 'always'],
        },
    },
    {
        files: ['**/*.test.ts'],
        rules: {
            'no-console': 'off',
        },
    },
    {
        ignores: ['dist', 'node_modules', 'coverage', '*.js', '*.d.ts', '**/*.test.ts'],
    }
];
