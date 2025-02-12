import dedent from 'dedent';
import {patchFileParameters, PatchFileParameter} from '@oniichan/shared/tool';
import {stringifyError} from '@oniichan/shared/error';
import {patchContent, PatchParseError} from '@oniichan/shared/patch';
import {EditorHost} from '../../editor';
import {resultMarkdown, ToolImplementBase, ToolRunResult} from './utils';

export class PatchFilesToolImplement extends ToolImplementBase<PatchFileParameter> {
    constructor(editorHost: EditorHost) {
        super(editorHost, patchFileParameters);
    }

    protected parseArgs(args: Record<string, string | undefined>) {
        return {
            path: args.path,
            patch: args.patch,
        };
    }

    protected async execute(args: PatchFileParameter): Promise<ToolRunResult> {
        const workspace = this.editorHost.getWorkspace();
        try {
            const content = await workspace.readWorkspaceFile(args.path);

            if (!content) {
                return {
                    type: 'executeError',
                    output:
                        `There is no original ${args.path}, please carefully check the existence and content of file, use \`write_file\` tool if you are creating a new file`,
                };
            }
            const patched = patchContent(content, args.patch);

            return {
                type: 'success',
                finished: false,
                output: resultMarkdown(
                    `Patch is written to ${args.path}, here is the new content of this file:`,
                    patched.newContent
                ),
            };
        }
        catch (ex) {
            if (ex instanceof PatchParseError) {
                // TODO: Allow this fix to not exposed to model and user
                // TODO: Maybe we can provide more detailed error like which search content is not found
                return {
                    type: 'executeError',
                    output: dedent`
                        Parse <patch> parameter error: ${stringifyError(ex)}.

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
                };
            }
            return {
                type: 'executeError',
                output: `Patch file ${args.path} failed: ${stringifyError(ex)}`,
            };
        }
    }
}
