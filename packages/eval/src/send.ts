import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {newUuid} from '@oniichan/shared/id';
import type {InboxSendMessageRequest} from '@oniichan/kernel/protocol';
import {createKernel, createConfiguration} from './core/index.js';

const command = yargs(hideBin(process.argv))
    .option('cwd', {type: 'string', demandOption: true})
    .option('query', {type: 'string', demandOption: true})
    .option('config', {type: 'string', demandOption: false, default: 'config.json'});

async function main() {
    const argv = await command.parse();
    const config = await createConfiguration(argv.config, {reportFile: 'report.json'});
    const kernel = await createKernel(argv.cwd, config);
    const input: InboxSendMessageRequest = {
        threadUuid: newUuid(),
        uuid: newUuid(),
        workingMode: config.mode,
        body: {
            type: 'text',
            content: argv.query,
        },
    };
    const state = {
        latestMessageUuid: '',
        reasoning: false,
    };
    for await (const chunk of kernel.callStreaming(newUuid(), 'inboxSendMessage', input)) {
        if (chunk.replyUuid !== state.latestMessageUuid) {
            if (state.latestMessageUuid) {
                console.log();
            }
            console.log(`<------------------------------ ${chunk.replyUuid} ------------------------------>`);
            state.latestMessageUuid = chunk.replyUuid;
            state.reasoning = false;
        }

        if (chunk.value.type === 'reasoning') {
            if (!state.reasoning) {
                state.reasoning = true;
                console.log('<think>');
            }
            process.stdout.write(chunk.value.content);
        }
        else {
            if (state.reasoning) {
                state.reasoning = false;
                console.log();
                console.log('</think>');
            }
            const text = 'source' in chunk.value ? chunk.value.source : chunk.value.content;
            process.stdout.write(text);
        }
    }
    console.log();
}

void main();
