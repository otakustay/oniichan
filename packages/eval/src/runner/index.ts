import path from 'node:path';
import fs from 'node:fs/promises';
import type {InboxSendMessageRequest} from '@oniichan/kernel/protocol';
import {newUuid} from '@oniichan/shared/id';
import type {FixtureConfig, ShellSetup} from '../fixtures';
import type {EvalConfig} from '../server';
import {createFixtureSource} from '../source';
import {createFixtureMatcher} from '../matcher';
import type {FixtureMatcherConfig} from '../matcher';
import {createKernel} from './kernel';
import {consumeChunkStream} from './utils';

interface UserConfig extends Omit<EvalConfig, 'evalDirectory'> {
    evalDirectory: string;
}

export class FixtureRunner {
    private readonly fixture: FixtureConfig;

    constructor(fixture: FixtureConfig) {
        this.fixture = fixture;
    }

    async run() {
        const cwd = await this.runFixture();

        for (const matcher of this.fixture.tests) {
            await this.runMatch(cwd, matcher);
        }
    }

    private async readConfiguration(): Promise<EvalConfig> {
        const file = path.resolve(__dirname, '..', '..', 'config.json');
        const content = await fs.readFile(file, {encoding: 'utf-8'});
        const userConfig = JSON.parse(content) as UserConfig;
        return {
            ...userConfig,
            evalDirectory: userConfig.evalDirectory ?? path.resolve(__dirname, 'fixtures', 'tmp'),
        };
    }

    private async runFixture() {
        const {default: ora} = await import('ora');
        const spinner = ora({text: this.fixture.name, hideCursor: false, discardStdin: false}).start();

        spinner.text = `${this.fixture.name} (fetch)`;
        const config = await this.readConfiguration();
        const source = createFixtureSource(this.fixture.source);
        const cwd = await source.fetch(this.fixture.name, config.evalDirectory);

        spinner.text = `${this.fixture.name} (setup)`;
        for (const setupItem of this.fixture.setup ?? []) {
            await this.runSetupScript(cwd, setupItem);
        }

        spinner.text = this.fixture.name;
        const kernel = await createKernel(cwd, config);
        const input: InboxSendMessageRequest = {
            threadUuid: newUuid(),
            uuid: newUuid(),
            workingMode: 'normal',
            body: {
                type: 'text',
                content: this.fixture.query.text,
            },
        };
        const chunkStream = kernel.callStreaming(newUuid(), 'inboxSendMessage', input);
        for await (const {status, label} of consumeChunkStream(chunkStream)) {
            const text = `${this.fixture.name} (${label})`;
            switch (status) {
                case 'spinning':
                    spinner.text = text;
                    break;
                case 'success':
                    spinner.succeed(text);
                    break;
                case 'fail':
                    spinner.fail(text);
                    break;
            }
        }

        return cwd;
    }

    private async runSetupScript(cwd: string, item: string | string[] | ShellSetup) {
        const {execa} = await import('execa');
        if (typeof item === 'string') {
            await execa(item, {cwd});
        }
        else if (Array.isArray(item)) {
            const [command, ...args] = item;
            await execa(command, args, {cwd});
        }
        else if (item.type === 'shell') {
            const script = Array.isArray(item.script) ? item.script.join('\n') : item.script;
            await execa(script, {cwd, shell: true});
        }
        else {
            throw new Error(`Unknown setup type ${item.type}`);
        }
    }

    private async runMatch(cwd: string, config: FixtureMatcherConfig) {
        const {default: ora} = await import('ora');

        const spinner = ora({indent: 2, text: config.name, hideCursor: false, discardStdin: false}).start();
        const matcher = createFixtureMatcher(cwd, config);
        const result = await matcher.runMatch();
        const output = `${config.name} ${result.score}/${result.totalScore}`;

        if (result.score >= config.minScore) {
            spinner.succeed(output);
        }
        else {
            spinner.fail(output);
        }

        for (const item of result.items) {
            const spinner = ora({indent: 4, text: item.description});
            if (item.pass) {
                spinner.succeed();
            }
            else {
                spinner.fail();
            }
        }
    }
}
