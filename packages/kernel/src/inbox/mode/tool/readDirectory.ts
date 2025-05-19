import path from 'node:path';
import dedent from 'dedent';
import type {ReadDirectoryParameter} from '@oniichan/shared/tool';
import type {FileEntry} from '@oniichan/editor-host/protocol';
import {stringifyError} from '@oniichan/shared/error';
import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import {ToolProviderBase} from './base';
import type {ToolExecuteResult} from './base';
import {asString} from './utils';

export class ReadDirectoryToolImplement extends ToolProviderBase<ReadDirectoryParameter> {
    async executeApprove(args: ReadDirectoryParameter): Promise<ToolExecuteResult> {
        try {
            const root = await this.editorHost.call('getWorkspaceRoot');

            if (!root) {
                return {
                    type: 'success',
                    finished: false,
                    executionData: {},
                    template: 'No open workspace, you cannot read any file or directory now.',
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
                    executionData: {path: args.path},
                    template: 'There are no files in directory {{path}}.',
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
                executionData: {path: args.path, tree: tree.join('\n')},
                template: dedent`
                    Files in directory {{path}}, directories are followed by \`/\`, once you need to read a child file or directory, do remember to prefix the path with current parent \`{{path}}\`:

                    \`\`\`
                    {{tree}}
                    \`\`\`
                `,
            };
        }
        catch (ex) {
            return {
                type: 'error',
                finished: false,
                executionData: {message: stringifyError(ex)},
                template: 'Unable to read directory {{path}}: {{message}}.',
            };
        }
    }

    extractParameters(generated: Record<string, RawToolCallParameter>): Partial<ReadDirectoryParameter> {
        return {
            path: asString(generated.path, true),
            recursive: generated.recursive === 'true',
        };
    }

    parseParameters(extracted: Partial<ReadDirectoryParameter>): ReadDirectoryParameter {
        return {
            path: extracted.path ?? '',
            recursive: extracted.recursive,
        };
    }
}
