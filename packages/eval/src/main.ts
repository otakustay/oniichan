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
    .option('config', {type: 'string', demandOption: false, default: 'config.json'});

async function readConfiguration(file: string): Promise<EvalConfig> {
    const content = await fs.readFile(path.resolve(__dirname, '..', file), {encoding: 'utf-8'});
    const userConfig = JSON.parse(content) as UserConfig;
    return {
        ...userConfig,
        evalDirectory: userConfig.evalDirectory ?? path.resolve(__dirname, 'fixtures', 'tmp'),
    };
}

async function main() {
    const {default: pLimit} = await import('p-limit');
    const argv = await command.parse();
    const config: RunnerInit = {
        concurrent: argv.concurrent,
        config: await readConfiguration(argv.config),
    };

    const limit = pLimit(argv.concurrent ? 10 : 1);
    const run = async (fixture: FixtureConfig) => {
        const runner = new FixtureRunner(fixture, config);
        await runner.run();
    };
    await Promise.all(fixtures.map(v => limit(run, v)));
}

void main();
