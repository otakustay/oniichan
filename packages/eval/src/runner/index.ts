import path from 'node:path';
import fs from 'node:fs/promises';
import type {InboxMessageResponse, InboxSendMessageRequest} from '@oniichan/kernel/protocol';
import {newUuid} from '@oniichan/shared/id';
import type {FixtureConfig} from '../fixtures';
import type {EvalConfig} from '../server';
import {createFixtureSource} from '../source';
import {createKernel} from './kernel';

interface UserConfig extends Omit<EvalConfig, 'evalDirectory'> {
    evalDirectory: string;
}

function chunkToString(chunk: InboxMessageResponse) {
    return 'source' in chunk.value ? chunk.value.source : chunk.value.content;
}

export class FixtureRunner {
    private readonly fixture: FixtureConfig;

    constructor(fixture: FixtureConfig) {
        this.fixture = fixture;
    }

    async run() {
        const config = await this.readConfiguration();
        const source = createFixtureSource(this.fixture.source);
        const cwd = await source.setup(this.fixture.name, config.evalDirectory);
        const kernel = await createKernel(cwd, config);

        const state = {
            latestMessageUuid: '',
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
            if (chunk.replyUuid !== state.latestMessageUuid) {
                if (state.latestMessageUuid) {
                    console.log();
                }
                console.log(
                    `<----------------------------------- ${chunk.replyUuid} ----------------------------------->`
                );
                state.latestMessageUuid = chunk.replyUuid;
            }

            process.stdout.write(chunkToString(chunk));
        }

        console.log();
        console.log();
        console.log(`Output: ${cwd}`);
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
}
