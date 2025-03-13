import path from 'node:path';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import type {FileEntry} from '@oniichan/editor-host/protocol';
import {RequestHandler} from '../handler';
import {ScaffoldApi} from './api';

const MAX_SNIPPET_COUNT = 10;

export interface ScaffoldRequest {
    documentUri: string;
    workspaceRoot: string;
}

interface ScaffoldTelemetryData {
    type: 'telemetryData';
    key: string;
    value: unknown;
}

interface ScaffoldLoading {
    type: 'loading';
}

interface ScaffoldAbort {
    type: 'abort';
    reason: string;
}

interface ScaffoldCode {
    type: 'code';
    section: 'import' | 'definition';
    code: string;
}

export type ScaffoldResponse = ScaffoldTelemetryData | ScaffoldLoading | ScaffoldAbort | ScaffoldCode;

interface ScaffoldSnippet {
    path: string;
    content: string;
}

export class ScaffoldHandler extends RequestHandler<ScaffoldRequest, ScaffoldResponse> {
    static readonly action = 'scaffold';

    private readonly api = new ScaffoldApi(this.context.editorHost);

    async *handleRequest(request: ScaffoldRequest): AsyncIterable<ScaffoldResponse> {
        const {logger} = this.context;

        const documentStatus = await this.testDocumentStatus(request.documentUri);
        if (!documentStatus.ok) {
            logger.info('Abort', {reason: documentStatus.reason});
            yield {
                type: 'abort',
                reason: documentStatus.reason,
            };
            return;
        }

        yield {type: 'loading'};

        const relativePath = this.getRelativePath(request.workspaceRoot, request.documentUri);
        yield {
            type: 'telemetryData',
            key: 'document',
            value: relativePath,
        };
        logger.trace('RetrieveContextStart');
        const snippets = await this.retrieveContext(request.workspaceRoot, relativePath);
        logger.trace('RetrieveContextFinish');
        yield {
            type: 'telemetryData',
            key: 'references',
            value: snippets.map(v => v.path),
        };

        if (!snippets.length) {
            logger.info('Abort', {reason: 'Not enough context'});
            yield {
                type: 'abort',
                reason: 'Not enough context',
            };
            return;
        }

        const telemetry = new FunctionUsageTelemetry(this.getTaskId(), 'Scaffold');
        logger.trace('RequestModelStart');
        const output = {
            importSection: '',
            definitionSection: '',
        };
        for await (const chunk of this.api.generate({file: relativePath, snippets}, telemetry)) {
            yield {type: 'code', section: chunk.section, code: chunk.code};
            output[`${chunk.section}Section`] += chunk.code;
        }
        yield {
            type: 'telemetryData',
            key: 'importSection',
            value: output.importSection,
        };
        yield {
            type: 'telemetryData',
            key: 'definitionSection',
            value: output.definitionSection,
        };
        logger.trace('RequestModelFinish');
    }

    private getRelativePath(workspaceRoot: string, documentUri: string) {
        const url = new URL(documentUri);
        return path.relative(workspaceRoot, url.pathname);
    }

    private async testDocumentStatus(documentUri: string) {
        const {editorHost} = this.context;
        try {
            const text = await editorHost.call('getDocumentText', documentUri);
            if (text) {
                return {
                    ok: false,
                    reason: 'Document is not empty',
                };
            }
            return {
                ok: true,
                reason: '',
            };
        }
        catch {
            return {
                ok: false,
                reason: 'Document is not open',
            };
        }
    }

    private async retrieveSiblingFiles(workspaceRoot: string, relativePath: string, entries: FileEntry[]) {
        const directory = path.dirname(relativePath);
        const fsDirectory = path.join(workspaceRoot, directory);
        const extension = path.extname(relativePath);
        const name = path.basename(relativePath);
        const targets = entries
            .filter(v => v.type === 'file')
            .filter(v => path.extname(v.name) === extension)
            .filter(v => v.name !== name)
            .slice(0, MAX_SNIPPET_COUNT);
        return this.readSnippets(workspaceRoot, fsDirectory, targets.map(v => v.name));
    }

    private async retrieveSiblingDirectories(workspaceRoot: string, relativePath: string, entries: FileEntry[]) {
        const directory = path.dirname(relativePath);
        const fsDirectory = path.join(workspaceRoot, directory);
        // We require all files in one directory to group together, for model to know the relationship between them
        const targets: string[] = [];
        for (const directory of entries.filter(v => v.type === 'directory')) {
            const childFiles = directory.children?.filter(v => v.type === 'file') ?? [];

            if (targets.length + childFiles.length > MAX_SNIPPET_COUNT) {
                continue;
            }

            targets.push(...childFiles.map(v => path.join(directory.name, v.name)));
        }
        return this.readSnippets(workspaceRoot, fsDirectory, targets);
    }

    private async retrieveParentEntries(workspaceRoot: string, relativePath: string): Promise<ScaffoldSnippet[]> {
        const {editorHost, logger} = this.context;
        const directory = path.dirname(relativePath);
        const fsDirectory = path.join(workspaceRoot, directory);
        const parentDirectory = path.join(fsDirectory, '..');
        const extension = path.extname(relativePath);
        logger.trace('ReadParentDirectoryStart', {directory: parentDirectory});
        const entries = await editorHost.call('readDirectory', {path: parentDirectory, depth: 2});
        logger.trace('ReadParentDirectoryFinish', {directory: parentDirectory, entries});

        const files: string[] = [];
        const directories: string[][] = [];
        for (const entry of entries) {
            if (entry.type === 'file' && path.extname(entry.name) === extension) {
                files.push(entry.name);
            }
            else if (entry.type === 'directory') {
                const files = (entry.children ?? []).filter(v => v.type === 'file');
                directories.push(files.map(v => path.join(entry.name, v.name)));
            }
        }

        const targets: string[] = [];
        for (const files of directories) {
            if (files.length + targets.length > MAX_SNIPPET_COUNT) {
                continue;
            }
            targets.push(...files);
        }
        targets.push(...files.slice(0, MAX_SNIPPET_COUNT - targets.length));

        return this.readSnippets(workspaceRoot, parentDirectory, targets);
    }

    private async retrieveContext(workspaceRoot: string, relativePath: string): Promise<ScaffoldSnippet[]> {
        const {editorHost, logger} = this.context;
        const directory = path.dirname(relativePath);

        if (!directory && !workspaceRoot) {
            logger.trace('RetrieveContextAbort', {reason: 'File is at file system root'});
            return [];
        }

        const fsDirectory = path.join(workspaceRoot, directory);
        logger.trace('ReadDirectoryStart', {directory: fsDirectory});
        const entries = await editorHost.call('readDirectory', {path: fsDirectory, depth: 1});
        logger.trace('ReadDirectoryFinish', {directory: fsDirectory, entries});

        const siblingFileSnippets = await this.retrieveSiblingFiles(workspaceRoot, relativePath, entries);

        if (siblingFileSnippets.length) {
            return siblingFileSnippets;
        }

        const siblingDirectorySnippets = await this.retrieveSiblingDirectories(workspaceRoot, relativePath, entries);

        if (siblingDirectorySnippets.length) {
            return siblingDirectorySnippets;
        }

        const parentSnippets = await this.retrieveParentEntries(workspaceRoot, relativePath);
        return parentSnippets;
    }

    private async readSnippets(workspaceRoot: string, directory: string, files: string[]): Promise<ScaffoldSnippet[]> {
        const {editorHost, logger} = this.context;
        const toSnippet = async (file: string): Promise<ScaffoldSnippet> => {
            const target = path.join(directory, file);
            logger.trace('ReadFileStart', {file: target});
            const content = await editorHost.call('readFile', target);
            logger.trace('ReadFileFinish', {file: target});
            return {path: path.relative(workspaceRoot, target), content: content.trim()};
        };
        const results = await Promise.allSettled(files.map(toSnippet));
        return results.filter(v => v.status === 'fulfilled').map(v => v.value);
    }
}
