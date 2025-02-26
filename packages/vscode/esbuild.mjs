import esbuild from 'esbuild';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

function reportStart() {
    console.log('[watch] build started');
}

function reportFinish(result) {
    for (const {text, location} of result.errors) {
        console.error(`✘ [ERROR] ${text}`);
        console.error(`    ${location.file}:${location.line}:${location.column}:`);
    }
    console.log('[watch] build finished');
}

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
    name: 'esbuild-problem-matcher',

    setup(build) {
        build.onStart(reportStart);
        build.onEnd(reportFinish);
    },
};

try {
    const buidlContext = {
        entryPoints: [
            'src/extension.ts',
            'src/kernel/entry.ts',
        ],
        bundle: true,
        format: 'cjs',
        minify: production,
        sourcemap: !production,
        keepNames: true,
        sourcesContent: false,
        platform: 'node',
        outdir: 'dist',
        external: ['vscode'],
        logLevel: 'silent',
        banner: {
            js: 'const _importMetaUrl=require(\'url\').pathToFileURL(__filename)',
        },
        define: {
            'import.meta.url': '_importMetaUrl',
        },
        loader: {
            '.prompt': 'text',
        },
        plugins: [
            /* add to the end of plugins array */
            esbuildProblemMatcherPlugin,
        ],
    };
    const context = await esbuild.context(buidlContext);

    if (watch) {
        await context.watch();
    }
    else {
        await context.rebuild();
        await context.dispose();
    }
}
catch (ex) {
    console.error(ex);
    process.exit(1);
}
