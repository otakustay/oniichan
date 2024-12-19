import path from 'node:path';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {RequestHandler} from '../handler';
import {ScaffoldApi} from './api';

const MAX_SNIPPET_COUNT = 10;

export interface ScaffoldRequest {
    documentUri: string;
    workspaceRoot: string;
}

interface ScaffoldLoading {
    type: 'loading';
}

interface ScaffoldAbort {
    type: 'abort';
    reason: string;
}

interface ScaffoldImportSection {
    type: 'importSection';
    code: string;
}

interface ScaffoldDefinitionSection {
    type: 'definitionSection';
    code: string;
}

export type ScaffoldResponse = ScaffoldLoading | ScaffoldAbort | ScaffoldImportSection | ScaffoldDefinitionSection;

interface ScaffoldSnippet {
    path: string;
    content: string;
}

export class ScaffoldHandler extends RequestHandler<ScaffoldRequest, ScaffoldResponse> {
    static action = 'scaffold' as const;

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
        const snippets = await this.retrieveContext(request.workspaceRoot, relativePath);

        if (!snippets.length) {
            logger.info('Abort', {reason: 'Not enough context'});
            yield {
                type: 'abort',
                reason: 'Not enough context',
            };
            return;
        }

        const telemetry = new FunctionUsageTelemetry(this.getTaskId(), 'Scaffold');
        const api = new ScaffoldApi(this.getTaskId(), this.context.editorHost);
        logger.trace('RequestModelStart');
        const output = await api.generate({file: relativePath, snippets}, telemetry);
        logger.trace('RequestModelFinish', output);
        yield {
            type: 'importSection',
            code: output.importSection,
        };
        yield {
            type: 'definitionSection',
            code: output.definitionSection,
        };
    }

    private getRelativePath(workspaceRoot: string, documentUri: string) {
        const url = new URL(documentUri);
        return path.relative(workspaceRoot, url.pathname);
    }

    private async testDocumentStatus(documentUri: string) {
        const {editorHost} = this.context;
        try {
            const text = await editorHost.getDocument(documentUri, this.getTaskId()).getText();
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

    private async retrieveContext(workspaceRoot: string, relativePath: string): Promise<ScaffoldSnippet[]> {
        const {editorHost, logger} = this.context;
        const workspace = editorHost.getWorkspace(this.getTaskId());
        const directory = path.dirname(relativePath);

        logger.trace('RetrieveContextStart');

        if (!directory && !workspaceRoot) {
            logger.trace('RetrieveContextAbort', {reason: 'File is at file system root'});
            return [];
        }

        const name = path.basename(relativePath);
        const fsDirectory = path.join(workspaceRoot, directory);
        logger.trace('ReadDirectoryStart', {directory: fsDirectory});
        const entries = await workspace.readDirectory(fsDirectory, {depth: 1});
        const files = entries.filter(v => v.type === 'file').filter(v => v.name !== name);
        logger.trace('ReadDirectoryFinish', {directory: fsDirectory, entries});

        if (files.length >= 1) {
            const targets = files.slice(0, MAX_SNIPPET_COUNT);
            return this.readSnippets(workspaceRoot, fsDirectory, targets.map(v => v.name));
        }

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

    private async readSnippets(workspaceRoot: string, directory: string, files: string[]): Promise<ScaffoldSnippet[]> {
        const {editorHost, logger} = this.context;
        const toSnippet = async (file: string): Promise<ScaffoldSnippet> => {
            const target = path.join(directory, file);
            logger.trace('ReadFileStart', {file: target});
            const workspace = editorHost.getWorkspace(this.getTaskId());
            const content = await workspace.readFile(target);
            logger.trace('ReadFileFinish', {file: target});
            return {path: path.relative(workspaceRoot, target), content: content.trim()};
        };
        const results = await Promise.allSettled(files.map(toSnippet));
        return results.filter(v => v.status === 'fulfilled').map(v => v.value);
    }
}
