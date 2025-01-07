import path from 'node:path';
import {Configuration} from '@rspack/cli';
import ReactRefreshPlugin from '@rspack/plugin-react-refresh';
import {HtmlRspackPlugin} from '@rspack/core';

const isDev = process.env.NODE_ENV === 'development';

const config: Configuration = {
    entry: './src/index.tsx',
    experiments: {
        css: true,
    },
    devServer: {
        port: 8988,
    },
    output: {
        clean: true,
        path: path.resolve(__dirname, '..', 'vscode', 'dist', 'web'),
        filename: 'main.js',
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
        extensions: ['...', '.ts', '.tsx'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: {
                    loader: 'builtin:swc-loader',
                    options: {
                        jsc: {
                            parser: {
                                syntax: 'typescript',
                            },
                        },
                    },
                },
                type: 'javascript/auto',
            },
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
            {
                test: /\.png$/,
                type: 'asset/inline',
            },
        ],
    },
    plugins: [
        new HtmlRspackPlugin({title: 'Oniichan'}),
        isDev && new ReactRefreshPlugin(),
    ],
    performance: {
        hints: false,
    },
};

export default config;
