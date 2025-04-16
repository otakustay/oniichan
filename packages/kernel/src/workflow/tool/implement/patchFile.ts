import dedent from 'dedent';
import type {PatchFileParameter} from '@oniichan/shared/tool';
import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import {ensureArray} from '@oniichan/shared/array';
import {ToolImplementBase} from './base';
import type {ToolExecuteResult} from './base';
import {asString} from './utils';

interface Extracted {
    path: string | undefined;
    patch: string[];
}

export class PatchFilesToolImplement extends ToolImplementBase<PatchFileParameter, Extracted> {
    async executeApprove(args: PatchFileParameter): Promise<ToolExecuteResult> {
        const chunk = this.getToolCallChunkStrict('patch_file');
        const fileEdit = await this.applyFileEdit(args.path, 'patch', args.patches.join('\n'));
        chunk.executionData = fileEdit;

        if (fileEdit.type === 'error') {
            return {
                type: 'error',
                finished: false,
                executionData: {path: args.path, message: fileEdit.message},
                template: fileEdit.errorType === 'patchError'
                    ? dedent`
                        Parse <patch> parameter error: {{message}}.

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
                    : `Patch file {{path}} failed for this reason: {{message}}`,
            };
        }

        return {
            type: 'success',
            finished: false,
            executionData: {path: args.path, newContent: fileEdit.newContent},
            template: dedent`
                Patch is written to {{path}}, here is the new content of this file:,

                \`\`\`
                {{newContent}}
                \`\`\`
            `,
        };
    }

    extractParameters(generated: Record<string, RawToolCallParameter>): Extracted {
        return {
            path: asString(generated.path, true),
            patch: ensureArray(generated.patch),
        };
    }

    parseParameters(extracted: Extracted): PatchFileParameter {
        return {
            path: extracted.path ?? '',
            patches: extracted.patch,
        };
    }
}
