import fs from 'node:fs/promises';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {fixtures} from './fixtures';
import type {FixtureConfig} from './fixtures';
import {FixtureRunner} from './runner';
import type {RunnerInit} from './runner';
import {createConfiguration} from './core';

const command = yargs(hideBin(process.argv))
    .option('concurrent', {type: 'boolean', demandOption: false, default: false})
    .option('report', {type: 'string', demandOption: false})
    .option('config', {type: 'string', demandOption: false, default: 'config.json'})
    .option('only', {type: 'string', demandOption: false});

async function main() {
    const {default: pLimit} = await import('p-limit');
    const argv = await command.parse();
    const config = await createConfiguration(argv.config, {reportFile: argv.report ?? 'report.json'});
    const init: RunnerInit = {config, concurrent: argv.concurrent};

    await fs.rm(config.reportFile, {force: true});

    const targetFixtures = argv.only ? fixtures.filter(v => v.name === argv.only) : fixtures;

    if (!targetFixtures.length) {
        console.error('No fixture to evaluate');
        process.exit(404);
    }

    const limit = pLimit(argv.concurrent ? 10 : 1);
    const run = async (fixture: FixtureConfig) => {
        const runner = new FixtureRunner(fixture, init);
        await runner.run();
    };
    await Promise.all(targetFixtures.map(v => limit(run, v)));
}

void main();
