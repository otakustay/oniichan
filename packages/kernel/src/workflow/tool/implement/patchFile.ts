import dedent from 'dedent';
import type {PatchFileParameter} from '@oniichan/shared/tool';
import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import {ToolImplementBase} from './base';
import type {ToolExecuteResult} from './base';
import {resultMarkdown} from '../utils';
import {asString} from './utils';

export class PatchFilesToolImplement extends ToolImplementBase<PatchFileParameter> {
    async executeApprove(args: PatchFileParameter): Promise<ToolExecuteResult> {
        const chunk = this.getToolCallChunkStrict('patch_file');
        const fileEdit = await this.applyFileEdit(args.path, 'patch', args.patch);
        chunk.executionData = fileEdit;

        if (fileEdit.type === 'error') {
            return {
                type: 'executeError',
                output: fileEdit.errorType === 'patchError'
                    ? dedent`
                        Parse <patch> parameter error: ${fileEdit.message}}.

                        A patch block always consists a \`SEARCH\` and a \`REPLACE\` part, in format like this:

                        \`\`\`
                        <<<<<<< SEARCH
                        [Exact content to search]
                        =======
                        [New content to replace with]
                        >>>>>>> REPLACE
                        \`\`\`

                        Please regenerate the <patch_file> tool call with correct patch content.
                    `
                    : `Patch file ${args.path} failed for this reason: ${fileEdit.message}`,
            };
        }

        return {
            type: 'success',
            finished: false,
            output: resultMarkdown(
                `Patch is written to ${args.path}, here is the new content of this file:`,
                fileEdit.newContent
            ),
        };
    }

    extractParameters(generated: Record<string, RawToolCallParameter>): Partial<PatchFileParameter> {
        return {
            path: asString(generated.path, true),
            patch: asString(generated.patch),
        };
    }

    parseParameters(extracted: Partial<PatchFileParameter>): PatchFileParameter {
        return {
            path: extracted.path ?? '',
            patch: extracted.patch ?? '',
        };
    }
}
