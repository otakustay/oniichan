import path from 'node:path';
import {Configuration} from '@rspack/cli';
import ReactRefreshPlugin from '@rspack/plugin-react-refresh';
import {HtmlRspackPlugin} from '@rspack/core';

const isDev = process.env.NODE_ENV === 'development';

const config: Configuration = {
    entry: './src/index.tsx',
    output: {
        path: path.resolve(__dirname, '..', 'vscode', 'dist', 'web'),
        filename: 'main.js',
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
        extensions: ['...', '.tsx', '.ts'],
    },
    module: {
        rules: [
            {
                test: /\.tsx$/,
                use: {
                    loader: 'builtin:swc-loader',
                    options: {
                        jsc: {
                            transform: {
                                react: {
                                    runtime: 'automatic',
                                },
                            },
                            parser: {
                                syntax: 'typescript',
                                tsx: true,
                            },
                        },
                    },
                },
                type: 'javascript/auto',
            },
        ],
    },
    plugins: [
        new HtmlRspackPlugin(),
        isDev && new ReactRefreshPlugin(),
    ],
};

export default config;
