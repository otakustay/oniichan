import path from 'node:path';
import {RequestHandler} from '../handler';
import {} from './scaffold.prompt';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {ScaffoldApi} from './api';

export interface ScaffoldRequest {
    workspaceRoot: string;
    relativePath: string;
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

export type ScaffoldResponse = ScaffoldAbort | ScaffoldImportSection | ScaffoldDefinitionSection;

interface ScaffoldSnippet {
    path: string;
    content: string;
}

export class ScaffoldHandler extends RequestHandler<ScaffoldRequest, ScaffoldResponse> {
    static action = 'scaffold' as const;

    async *handleRequest(request: ScaffoldRequest): AsyncIterable<ScaffoldResponse> {
        const {logger} = this.context;
        const snippets = await this.retrieveContext(request);

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
        const output = await api.generate({file: request.relativePath, snippets}, telemetry);
        logger.trace('RequestModelFinish');
        yield {
            type: 'importSection',
            code: output.importSection,
        };
        await new Promise(resolve => setTimeout(resolve, 1000));
        yield {
            type: 'definitionSection',
            code: output.definitionSection,
        };
    }

    private async retrieveContext({workspaceRoot, relativePath}: ScaffoldRequest) {
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
            const snippets = await Promise.all(files.map(v => this.fileToSnippet(workspaceRoot, fsDirectory, v.name)));
            return snippets;
        }

        // TODO: Handle the case where there are no files in the directory
        return [];
    }

    private async fileToSnippet(workspaceRoot: string, directory: string, file: string): Promise<ScaffoldSnippet> {
        const {editorHost, logger} = this.context;
        const target = path.join(directory, file);
        logger.trace('ReadFileStart', {file: target});
        const workspace = editorHost.getWorkspace(this.getTaskId());
        const content = await workspace.readFile(target);
        logger.trace('ReadFileFinish', {file: target});
        return {path: path.relative(workspaceRoot, target), content: content.trim()};
    }
}
