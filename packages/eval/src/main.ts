import path from 'node:path';
import fs from 'node:fs/promises';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {fixtures} from './fixtures';
import type {FixtureConfig} from './fixtures';
import {FixtureRunner} from './runner';
import type {RunnerInit} from './runner';
import type {EvalConfig} from './server';

interface UserConfig extends Omit<EvalConfig, 'evalDirectory'> {
    evalDirectory: string;
}

const command = yargs(hideBin(process.argv))
    .option('concurrent', {type: 'boolean', demandOption: false, default: false})
    .option('report', {type: 'string', demandOption: false})
    .option('config', {type: 'string', demandOption: false, default: 'config.json'});

async function main() {
    const {default: pLimit} = await import('p-limit');
    const argv = await command.parse();
    const configFileContent = await fs.readFile(path.resolve(__dirname, '..', argv.config), {encoding: 'utf-8'});
    const userConfig = JSON.parse(configFileContent) as UserConfig;
    const evalDirectory = userConfig.evalDirectory ?? path.resolve(__dirname, 'fixtures', 'tmp');
    const config: EvalConfig = {
        ...userConfig,
        evalDirectory,
        reportFile: path.resolve(evalDirectory, argv.report ?? 'report.json'),
    };
    const init: RunnerInit = {config, concurrent: argv.concurrent};

    await fs.rm(config.reportFile, {force: true});

    const limit = pLimit(argv.concurrent ? 10 : 1);
    const run = async (fixture: FixtureConfig) => {
        const runner = new FixtureRunner(fixture, init);
        await runner.run();
    };
    await Promise.all(fixtures.map(v => limit(run, v)));
}

void main();
