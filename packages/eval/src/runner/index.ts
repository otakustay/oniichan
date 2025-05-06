import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import type {InboxSendMessageRequest} from '@oniichan/kernel/protocol';
import {stringifyError} from '@oniichan/shared/error';
import {newUuid} from '@oniichan/shared/id';
import type {FixtureConfig, ShellSetup} from '../fixtures';
import type {EvalConfig} from '../server';
import {createFixtureSource} from '../source';
import {createFixtureMatcher} from '../matcher';
import type {FixtureMatcherConfig, FixtureMatcherItem} from '../matcher';
import {createKernel} from '../core';
import {consumeChunkStream} from './utils';
import type {EvalMessage} from './utils';
import {ConcurrentSpinner, DefaultSpinner} from './spinner';
import type {Spinner} from './spinner';

export interface RunnerInit {
    concurrent: boolean;
    config: EvalConfig;
}

interface RunnerMatchResult {
    name: string;
    minScore: number;
    maxScore: number;
    score: number;
    items: FixtureMatcherItem[];
}

export interface RunnerResult {
    fixtureName: string;
    matches: RunnerMatchResult[];
    messages: string[];
}

function stringifyMessageContent({reasoning, content}: EvalMessage) {
    return (reasoning ? `<think>\n${reasoning}\n</think>\n\n` : '') + content;
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

            const matches: RunnerMatchResult[] = [];
            for (const matcher of this.fixture.tests) {
                const result = await this.runMatch(cwd, matcher);
                const match: RunnerMatchResult = {
                    name: matcher.name,
                    minScore: matcher.minScore,
                    maxScore: result.totalScore,
                    score: result.score,
                    items: result.items,
                };
                matches.push(match);
            }

            if (!this.verbose) {
                const failed = matches.filter(v => v.score < v.minScore);
                const messageCount = `${this.messages.length} messages`;
                const failedMatches = failed.length
                    ? `${failed.length}/${matches.length} failed`
                    : '';
                await this.spinner.update(
                    failed.length ? 'fail' : 'success',
                    `${this.fixture.name} (${[messageCount, failedMatches].filter(v => !!v).join(' ')})`
                );
            }

            const result: RunnerResult = {
                fixtureName: this.fixture.name,
                matches,
                messages: this.messages.map(stringifyMessageContent),
            };
            await this.writeReport(result);
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
                workingMode: this.config.mode,
                body: {
                    type: 'text',
                    content: this.fixture.query.text,
                },
                references: this.fixture.query.references,
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

    private async writeReport(result: RunnerResult) {
        const current = await this.readReport();
        current.push(result);
        await fs.writeFile(this.config.reportFile, JSON.stringify(current, null, 2));
    }

    private async readReport(): Promise<RunnerResult[]> {
        if (existsSync(this.config.reportFile)) {
            const content = await fs.readFile(this.config.reportFile, 'utf8');
            return JSON.parse(content) as RunnerResult[];
        }

        return [];
    }
}
