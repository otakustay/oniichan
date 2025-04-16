import type {WriteFileParameter} from '@oniichan/shared/tool';
import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import {ToolImplementBase} from './base';
import type {ToolExecuteResult} from './base';
import {asString} from './utils';

export class WriteFileToolImplement extends ToolImplementBase<WriteFileParameter> {
    async executeApprove(args: WriteFileParameter): Promise<ToolExecuteResult> {
        const chunk = this.getToolCallChunkStrict('write_file');
        const fileEdit = await this.applyFileEdit(args.path, 'write', args.content);
        chunk.executionData = fileEdit;

        return fileEdit.type === 'error'
            ? {
                type: 'error',
                finished: false,
                executionData: {path: args.path, message: fileEdit.message},
                template: 'Write file {{path}} failed for this reason: {{message}}.',
            }
            : {
                type: 'success',
                finished: false,
                executionData: {path: args.path},
                template:
                    'File is written to {{path}}, you can trust the file content, it\'s not neccessary to read this file again.',
            };
    }

    extractParameters(generated: Record<string, RawToolCallParameter>): Partial<WriteFileParameter> {
        return {
            path: asString(generated.path, true),
            content: asString(generated.content),
        };
    }

    parseParameters(extracted: Partial<WriteFileParameter>): WriteFileParameter {
        return {
            path: extracted.path ?? '',
            content: extracted.content ?? '',
        };
    }
}
