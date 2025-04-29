import path from 'node:path';
import fs from 'node:fs/promises';
import {rgPath} from '@vscode/ripgrep';
import {DirectPort} from '@otakustay/ipc';
import type {Port} from '@otakustay/ipc';
import {DependencyContainer} from '@oniichan/shared/container';
import {KernelServer} from '@oniichan/kernel/server';
import {EditorHostClient} from '@oniichan/editor-host/client';
import {ThreadStore, CommandExecutor} from '@oniichan/kernel';
import {Logger, ConsoleLogger} from '@oniichan/shared/logger';
import {KernelClient} from '@oniichan/kernel/client';
import {EvalEditorHostServer} from '../server';
import type {EvalConfig} from '../server';

async function startEditorServer(port: Port, config: EvalConfig, cwd: string) {
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

export async function createKernel(cwd: string, config: EvalConfig) {
    const port = new DirectPort();
    await startEditorServer(port, config, cwd);
    await startKernelServer(port);
    const kernelClient = await startKernelClient(port);
    return kernelClient;
}

interface UserConfig extends Omit<EvalConfig, 'evalDirectory'> {
    evalDirectory: string;
}

interface ConfigDefault {
    reportFile: string;
}

export async function createConfiguration(file: string, defaults: ConfigDefault) {
    const baseDirectory = path.resolve(__dirname, '..', '..');
    const configFileContent = await fs.readFile(path.join(baseDirectory, file), {encoding: 'utf-8'});
    const userConfig = JSON.parse(configFileContent) as UserConfig;
    const evalDirectory = userConfig.evalDirectory ?? path.resolve(__dirname, 'fixtures', 'tmp');
    const config: EvalConfig = {
        ...userConfig,
        evalDirectory,
        reportFile: path.resolve(evalDirectory, defaults.reportFile),
    };
    return config;
}
