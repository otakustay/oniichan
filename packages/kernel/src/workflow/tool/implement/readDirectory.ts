import path from 'node:path';
import type {ReadDirectoryParameter} from '@oniichan/shared/tool';
import type {FileEntry} from '@oniichan/editor-host/protocol';
import {stringifyError} from '@oniichan/shared/error';
import {ToolImplementBase} from './base';
import type {ToolExecuteResult} from './base';
import {resultMarkdown} from '../utils';

export class ReadDirectoryToolImplement extends ToolImplementBase<ReadDirectoryParameter> {
    async executeApprove(args: ReadDirectoryParameter): Promise<ToolExecuteResult> {
        try {
            const root = await this.editorHost.call('getWorkspaceRoot');

            if (!root) {
                return {
                    type: 'success',
                    finished: false,
                    output: 'No open workspace, you cannot read any file or directory now.',
                };
            }

            const entries = await this.editorHost.call(
                'readDirectory',
                {
                    path: path.join(root, args.path),
                    depth: args.recursive ? Number.MAX_SAFE_INTEGER : 0,
                }
            );

            if (!entries.length) {
                return {
                    type: 'success',
                    finished: false,
                    output: `There are no files in directory ${args.path}.`,
                };
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

            process(entries);
            return {
                type: 'success',
                finished: false,
                output: resultMarkdown(
                    `Files in directory ${args.path}, directories are followed by \`/\`, once you need to read a child file or directory, do remember to prefix the path with current parent \`${args.path}\`:`,
                    tree.join('\n')
                ),
            };
        }
        catch (ex) {
            return {
                type: 'executeError',
                output: `Unable to read directory ${args.path}: ${stringifyError(ex)}`,
            };
        }
    }

    extractParameters(generated: Record<string, string | undefined>): Partial<ReadDirectoryParameter> {
        return {
            path: generated.path?.trim(),
            recursive: generated.recursive === 'true',
        };
    }
}
