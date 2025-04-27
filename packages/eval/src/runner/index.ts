import path from 'node:path';
import type {InboxSendMessageRequest} from '@oniichan/kernel/protocol';
import {stringifyError} from '@oniichan/shared/error';
import {newUuid} from '@oniichan/shared/id';
import type {FixtureConfig, ShellSetup} from '../fixtures';
import type {EvalConfig} from '../server';
import {createFixtureSource} from '../source';
import {createFixtureMatcher} from '../matcher';
import type {FixtureMatcherConfig, FixtureMatchResult} from '../matcher';
import {createKernel} from './kernel';
import {consumeChunkStream} from './utils';
import type {EvalMessage} from './utils';
import {ConcurrentSpinner, DefaultSpinner} from './spinner';
import type {Spinner} from './spinner';

export interface RunnerInit {
    concurrent: boolean;
    config: EvalConfig;
}

export interface RunnerResult {
    fixtureName: string;
    messages: string[];
    result: FixtureMatchResult;
}

export class FixtureRunner {
    private readonly fixture: FixtureConfig;

    private readonly verbose: boolean;

    private readonly config: EvalConfig;

    private readonly spinner: Spinner;

    private messages: EvalMessage[] = [];

    constructor(fixture: FixtureConfig, init: RunnerInit) {
        this.fixture = fixture;
        this.verbose = !init.concurrent;
        this.spinner = init.concurrent ? new ConcurrentSpinner(fixture.name) : new DefaultSpinner();
        this.config = {
            ...init.config,
            evalDirectory: init.config.evalDirectory ?? path.resolve(__dirname, 'fixtures', 'tmp'),
        };
    }

    async run() {
        try {
            const cwd = await this.runFixture();

            const matchResult = {
                passed: 0,
                failed: 0,
            };
            for (const matcher of this.fixture.tests) {
                const result = await this.runMatch(cwd, matcher);
                if (result.score < matcher.minScore) {
                    matchResult.failed++;
                }
                else {
                    matchResult.passed++;
                }
            }

            if (!this.verbose) {
                const messageCount = `${this.messages.length} messages`;
                const failedMatches = matchResult.failed
                    ? `${matchResult.failed}/${matchResult.failed + matchResult.passed} failed`
                    : '';
                await this.spinner.update(
                    matchResult.failed ? 'fail' : 'success',
                    `${this.fixture.name} (${[messageCount, failedMatches].filter(v => !!v).join(' ')})`
                );
            }
        }
        catch (ex) {
            if (!this.verbose) {
                await this.spinner.update('fail', `${this.fixture.name} (${stringifyError(ex)})`);
            }
        }
    }

    private async runFixture() {
        await this.spinner.update('running', `${this.fixture.name} (fetch)`);

        try {
            const source = createFixtureSource(this.fixture.source);
            const cwd = await source.fetch(this.fixture.name, this.config.evalDirectory);

            await this.spinner.update('running', `${this.fixture.name} (setup)`);
            for (const setupItem of this.fixture.setup ?? []) {
                await this.runSetupScript(cwd, setupItem);
            }

            await this.spinner.update('running', this.fixture.name);
            const kernel = await createKernel(cwd, this.config);
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
            for await (const {content, messages} of consumeChunkStream(chunkStream)) {
                this.messages = messages;
                const text = `${this.fixture.name} (${content})`;
                await this.spinner.update('running', text);
            }

            if (this.verbose) {
                await this.spinner.update('success', `${this.fixture.name} (${this.messages.length} messages)`);
            }

            return cwd;
        }
        catch (ex) {
            await this.spinner.update('fail', `${this.fixture.name} (${stringifyError(ex)})`);
            throw ex;
        }
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
        const matcher = createFixtureMatcher(cwd, config);

        if (!this.verbose) {
            await this.spinner.update('running', `${this.fixture.name} (check ${config.name})`);
            const result = await matcher.runMatch();
            return result;
        }

        const matchSpinner = await this.spinner.addChild(`check ${config.name}`, config.name);
        const result = await matcher.runMatch();
        await matchSpinner.update(
            result.score >= config.minScore ? 'success' : 'fail',
            `${config.name} ${result.score}/${result.totalScore}`
        );

        for (const item of result.items) {
            const itemSpinner = await matchSpinner.addChild(item.description, item.description);
            await itemSpinner.update(item.pass ? 'success' : 'fail', item.description);
        }

        return result;
    }
}
