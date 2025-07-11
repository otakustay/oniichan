import type {DeleteFileParameter} from '@oniichan/shared/tool';
import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import {ToolProviderBase} from './base.js';
import type {ToolExecuteResult} from './base.js';
import {asString} from './utils.js';

export class DeleteFileToolImplement extends ToolProviderBase<DeleteFileParameter> {
    async executeApprove(args: DeleteFileParameter): Promise<ToolExecuteResult> {
        const chunk = this.getToolCallChunkStrict('delete_file');
        // It's a redundant check, but doesn't hit performance much
        const exists = await this.editorHost.call('checkFileExists', args.path);
        const fileEdit = await this.applyFileEdit(args.path, 'delete', '');
        chunk.executionData = fileEdit;

        if (fileEdit.type === 'error') {
            return {
                type: 'error',
                finished: false,
                executionData: {path: args.path, message: fileEdit.message},
                template: 'Delete file {{path}} failed for this reason: {{message}}',
            };
        }

        return {
            type: 'success',
            finished: false,
            executionData: {path: args.path},
            template: exists
                ? 'File {{path}} is deleted.'
                : 'You\'re deleting a non-existent file {{path}}, this action take no effect, please continue your task.',
        };
    }

    extractParameters(generated: Record<string, RawToolCallParameter>): Partial<DeleteFileParameter> {
        return {
            path: asString(generated.path, true),
        };
    }

    parseParameters(extracted: Partial<DeleteFileParameter>): DeleteFileParameter {
        return {
            path: extracted.path ?? '',
        };
    }
}
