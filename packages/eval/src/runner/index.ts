import path from 'node:path';
import fs from 'node:fs/promises';
import type {InboxSendMessageRequest} from '@oniichan/kernel/protocol';
import {newUuid} from '@oniichan/shared/id';
import type {FixtureConfig} from '../fixtures';
import type {EvalConfig} from '../server';
import {createFixtureSource} from '../source';
import {createFixtureMatcher} from '../matcher';
import type {FixtureMatcherConfig} from '../matcher';
import {createKernel} from './kernel';

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

        const config = await this.readConfiguration();
        const source = createFixtureSource(this.fixture.source);
        const cwd = await source.setup(this.fixture.name, config.evalDirectory);
        const kernel = await createKernel(cwd, config);

        const state = {
            messages: new Set<string>(),
        };
        const input: InboxSendMessageRequest = {
            threadUuid: newUuid(),
            uuid: newUuid(),
            workingMode: 'normal',
            body: {
                type: 'text',
                content: this.fixture.query.text,
            },
        };
        for await (const chunk of kernel.callStreaming(newUuid(), 'inboxSendMessage', input)) {
            state.messages.add(chunk.replyUuid);

            if (chunk.value.type === 'toolStart') {
                spinner.text = `${this.fixture.name} (${chunk.value.toolName})`;
            }
        }
        spinner.succeed(`${this.fixture.name} (${state.messages.size} messages)`);
        return cwd;
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
