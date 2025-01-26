import path from 'node:path';
import {readDirectoryParameters, ReadDirectoryParameter} from '@oniichan/shared/tool';
import {FileEntry} from '@oniichan/editor-host/protocol';
import {stringifyError} from '@oniichan/shared/error';
import {EditorHost} from '../../editor';
import {resultMarkdown, ToolImplementBase} from './utils';

export class ReadDirectoryToolImplement extends ToolImplementBase<ReadDirectoryParameter> {
    constructor(editorHost: EditorHost) {
        super(editorHost, readDirectoryParameters);
    }

    protected parseArgs(args: Record<string, string>): ReadDirectoryParameter {
        return {
            path: args.path,
            recursive: args.recursive === 'true',
        };
    }

    protected async execute(args: ReadDirectoryParameter): Promise<string> {
        const workspace = this.editorHost.getWorkspace();
        try {
            const root = await workspace.getRoot();

            if (!root) {
                return 'No open workspace, you cannot read any file or directory now';
            }

            const tree: string[] = [];
            const process = (items: FileEntry[], indent = 0) => {
                if (!items.length) {
                    return;
                }

                const indentString = ' '.repeat(indent * 2);
                for (const item of items) {
                    tree.push(indentString + item.name + (item.type === 'directory' ? '/' : ''));
                    if (item.children?.length) {
                        process(item.children, indent + 1);
                    }
                }
            };
            const entries = await workspace.readDirectory(
                path.join(root, args.path),
                {depth: args.recursive ? Number.MAX_SAFE_INTEGER : 0}
            );
            process(entries);
            return resultMarkdown(
                `Files in directory ${args.path}, directories are followed by \`/\`:`,
                tree.join('\n')
            );
        }
        catch (ex) {
            return `Unable to read directory ${args.path}: ${stringifyError(ex)}`;
        }
    }
}
