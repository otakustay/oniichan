import path from 'node:path';
import type {ReadFileParameter} from '@oniichan/shared/tool';
import {stringifyError} from '@oniichan/shared/error';
import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import {ensureArray} from '@oniichan/shared/array';
import {resultMarkdown} from '../utils';
import {ToolImplementBase} from './base';
import type {ToolExecuteResult} from './base';

interface Extracted {
    path: string[];
}

export class ReadFileToolImplement extends ToolImplementBase<ReadFileParameter, Extracted> {
    async executeApprove(args: ReadFileParameter): Promise<ToolExecuteResult> {
        const contents = await Promise.all(args.paths.map(v => this.read(v)));
        return {
            type: 'success',
            finished: false,
            executionData: {files: contents.join('\n\n')},
            template: '{{files}}',
        };
    }

    extractParameters(generated: Record<string, RawToolCallParameter>): Extracted {
        return {
            // This is named `path` in model generated XML, but `paths` in type definition
            path: ensureArray(generated.path),
        };
    }

    parseParameters(extracted: Extracted): ReadFileParameter {
        return {
            paths: extracted.path,
        };
    }

    private async read(file: string) {
        try {
            const content = await this.editorHost.call('readWorkspaceFile', file);

            if (content === null) {
                return `Unable to read file ${file}: file not exists.`;
            }

            if (content === '') {
                return `File ${file} is an empty file.`;
            }

            if (content.length > 30000) {
                return `Unable to read file ${file} becaure the file is too large.`;
            }

            const language = path.extname(file).slice(1);
            return resultMarkdown(`Content of file ${file}:`, content, language);
        }
        catch (ex) {
            return `Unable to read file ${file}: ${stringifyError(ex)}`;
        }
    }
}
