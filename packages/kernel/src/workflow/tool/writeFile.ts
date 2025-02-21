import {writeFileParameters, WriteFileParameter} from '@oniichan/shared/tool';
import {ToolImplementBase, ToolImplementInit, ToolRunResult} from './utils';
import {stringifyError} from '@oniichan/shared/error';

export class WriteFileToolImplement extends ToolImplementBase<WriteFileParameter> {
    constructor(init: ToolImplementInit) {
        super('WriteFileToolImplement', init, writeFileParameters);
    }

    protected parseArgs(args: Record<string, string | undefined>) {
        return {
            path: args.path,
            content: args.content,
        };
    }

    protected async execute(args: WriteFileParameter): Promise<ToolRunResult> {
        const edit = this.origin.getFileEdit();

        if (!edit) {
            this.logger.error('NoFileEdit');
            // It should never happen
            return {
                type: 'executeError',
                output:
                    `There is a fatal error writing to ${args.path}, you should continue your work but remembering not to touch this file again.`,
            };
        }

        if (edit.type === 'error') {
            return {
                type: 'executeError',
                output: `Write file ${args.path} failed for this reason: ${edit.message}`,
            };
        }

        try {
            await this.editorHost.call('writeWorkspaceFile', {file: edit.file, content: edit.newContent});
            return {
                type: 'success',
                finished: false,
                output:
                    `File is written to ${args.path}, you can trust the file content, it's not neccessary to read this file again`,
            };
        }
        catch (ex) {
            return {
                type: 'executeError',
                output: `Write file ${args.path} failed for this reason: ${stringifyError(ex)}`,
            };
        }
    }
}
