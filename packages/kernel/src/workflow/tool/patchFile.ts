import dedent from 'dedent';
import {patchFileParameters, PatchFileParameter} from '@oniichan/shared/tool';
import {resultMarkdown, ToolImplementBase, ToolImplementInit, ToolRunResult} from './utils';

export class PatchFilesToolImplement extends ToolImplementBase<PatchFileParameter> {
    constructor(init: ToolImplementInit) {
        super('PatchFilesToolImplement', init, patchFileParameters);
    }

    protected parseArgs(args: Record<string, string | undefined>) {
        return {
            path: args.path,
            patch: args.patch,
        };
    }

    protected async execute(args: PatchFileParameter): Promise<ToolRunResult> {
        const edit = this.origin.getFileEdit();

        if (!edit) {
            return {
                type: 'success',
                finished: false,
                output:
                    `Patch is written to ${args.path}, however the new content is not retrieved at this moment, you can trust the patch and continue`,
            };
        }

        if (edit.type === 'error') {
            return edit.errorType === 'patchError'
                ? {
                    type: 'requireFix',
                    includesBase: true,
                    prompt: dedent`
                    Parse <patch> parameter error: ${edit.message}}.

                    A patch block always consists a \`SEARCH\` and a \`REPLACE\` part, in format like this:

                    \`\`\`
                    <<<<<<< SEARCH
                    [Exact content to search]
                    =======
                    [New content to replace with]
                    >>>>>>> REPLACE
                    \`\`\`

                    Please regenerate the <patch_file> tool call with correct patch content.
                `,
                }
                : {
                    type: 'executeError',
                    output: `Patch file ${args.path} failed for this reason: ${edit.message}`,
                };
        }

        return {
            type: 'success',
            finished: false,
            output: resultMarkdown(
                `Patch is written to ${args.path}, here is the new content of this file:`,
                edit.newContent
            ),
        };
    }
}
