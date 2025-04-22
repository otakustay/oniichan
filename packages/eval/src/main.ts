import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {rgPath} from '@vscode/ripgrep';
import {DirectPort} from '@otakustay/ipc';
import type {Port} from '@otakustay/ipc';
import {DependencyContainer} from '@oniichan/shared/container';
import {KernelServer} from '@oniichan/kernel/server';
import {EditorHostClient} from '@oniichan/editor-host/client';
import {ThreadStore, CommandExecutor} from '@oniichan/kernel';
import {Logger, ConsoleLogger} from '@oniichan/shared/logger';
import type {InboxMessageResponse, InboxSendMessageRequest} from '@oniichan/kernel/protocol';
import {KernelClient} from '@oniichan/kernel/client';
import {EvalEditorHostServer} from './server/server';
import type {EvalConfig} from './server/interface';

async function readConfiguration() {
    const file = path.resolve(__dirname, '..', 'config.json');
    const content = await fs.readFile(file, {encoding: 'utf-8'});
    return JSON.parse(content) as EvalConfig;
}

async function startEditorServer(port: Port, cwd: string) {
    const config = await readConfiguration();
    const logger = new ConsoleLogger('EditorHost');
    const server = new EvalEditorHostServer({cwd, logger, config});
    await server.connect(port);
    return server;
}

async function startKernelServer(port: Port) {
    const container = new DependencyContainer()
        .bind(ThreadStore, () => new ThreadStore([]), {singleton: true})
        .bind(EditorHostClient, () => new EditorHostClient(port), {singleton: true})
        .bind(Logger, () => new ConsoleLogger('Kernel'), {singleton: true})
        .bind(CommandExecutor, () => new CommandExecutor(path.dirname(rgPath)), {singleton: true});
    const server = new KernelServer(container);
    await server.connect(port);
    return server;
}

async function startKernelClient(port: Port) {
    return new KernelClient(port);
}

function chunkToString(chunk: InboxMessageResponse) {
    return 'source' in chunk.value ? chunk.value.source : chunk.value.content;
}

async function main() {
    const cwd = '/Users/otakustay/Develop/async-iterator';
    const port = new DirectPort();
    await startEditorServer(port, cwd);
    await startKernelServer(port);
    const kernelClient = await startKernelClient(port);

    const input: InboxSendMessageRequest = {
        threadUuid: crypto.randomUUID(),
        uuid: crypto.randomUUID(),
        workingMode: 'normal',
        body: {
            type: 'text',
            content: 'Hello world!',
        },
    };
    for await (const chunk of kernelClient.callStreaming(crypto.randomUUID(), 'inboxSendMessage', input)) {
        process.stdout.write(chunkToString(chunk));
        if (chunk.value.type === 'toolEnd') {
            console.log();
            console.log();
        }
    }
    console.log();
}

void main();
