import dedent from 'dedent';
import {patchFileParameters, PatchFileParameter} from '@oniichan/shared/tool';
import {stringifyError} from '@oniichan/shared/error';
import {resultMarkdown, ToolImplementBase, ToolImplementInit, ToolRunStep} from './utils';

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

    protected async execute(): Promise<ToolRunStep> {
        const args = this.getToolCallArguments();
        const edit = this.origin.getFileEdit();

        if (!edit) {
            this.logger.error('NoFileEdit');
            // It should never happen
            return {
                type: 'executeError',
                output:
                    `There is a fatal error patching ${args.path}, you should continue your work but remembering not to touch this file again.`,
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

        try {
            await this.editorHost.call('writeWorkspaceFile', {file: edit.file, content: edit.newContent});
            return {
                type: 'success',
                finished: false,
                output: resultMarkdown(
                    `Patch is written to ${args.path}, here is the new content of this file:`,
                    edit.newContent
                ),
            };
        }
        catch (ex) {
            return {
                type: 'executeError',
                output: `Patch file ${args.path} failed for this reason: ${stringifyError(ex)}`,
            };
        }
    }
}
