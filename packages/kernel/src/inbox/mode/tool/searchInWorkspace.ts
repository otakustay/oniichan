import path from 'node:path';
import dedent from 'dedent';
import unixify from 'unixify';
import type {SearchInWorkspaceParameter} from '@oniichan/shared/tool';
import {stringifyError} from '@oniichan/shared/error';
import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import {ToolProviderBase} from './base.js';
import type {ToolExecuteResult} from './base.js';
import {asString} from './utils.js';

// For each match, its a `begin - context - match - context - end` sequence,
// so a maximum of 1000 lines contains 200 search results
const MAX_LINES = 1000;

interface Text {
    text: string;
}

interface RipGrepOutputPathData {
    path: Text;
}

interface RipGrepCommandOutputLineData {
    path: Text;
    lines: Text;
}

interface RipGrepOutputItemOf<T, D> {
    type: T;
    data: D;
}

type RipGrepOutputItem =
    | RipGrepOutputItemOf<'begin', RipGrepOutputPathData>
    | RipGrepOutputItemOf<'context', RipGrepCommandOutputLineData>
    | RipGrepOutputItemOf<'match', RipGrepCommandOutputLineData>
    | RipGrepOutputItemOf<'end', RipGrepOutputPathData>
    | RipGrepOutputItemOf<'summary', unknown>;

interface GrepResult {
    file: string;
    contextBefore: string[];
    matches: string[];
    contextAfter: string[];
}

interface ConsumeState {
    current: GrepResult | null;
}

export class SearchInWorkspaceToolImplement extends ToolProviderBase<SearchInWorkspaceParameter> {
    private linesCount = 0;
    private readonly results: GrepResult[] = [];

    async executeApprove(args: SearchInWorkspaceParameter): Promise<ToolExecuteResult> {
        try {
            const root = await this.editorHost.call('getWorkspaceRoot');

            if (!root) {
                return {
                    type: 'success',
                    finished: false,
                    executionData: {},
                    template: 'No open workspace, you cannot search any file or directory now.',
                };
            }

            // If only glob is provided (no regex), use simple file listing
            if (args.glob && !args.regex) {
                return await this.executeGlobSearch(args, root);
            }

            // If regex is provided, use ripgrep search
            if (args.regex) {
                return await this.executeRegexSearch(args, root);
            }

            return {
                type: 'error',
                finished: false,
                executionData: {},
                template:
                    'You must provide either `glob` pattern for file listing or `regex` pattern for content search.',
            };
        }
        catch (ex) {
            return {
                type: 'error',
                finished: false,
                executionData: {message: stringifyError(ex)},
                template: 'Unable to search in workspace: {{message}}.',
            };
        }
    }

    private async executeGlobSearch(args: SearchInWorkspaceParameter, root: string): Promise<ToolExecuteResult> {
        const glob = args.glob ?? '';
        const files = await this.editorHost.call('findFiles', {glob, limit: 200});

        if (files.length) {
            return {
                type: 'success',
                finished: false,
                executionData: {glob, content: files.map(v => path.relative(root, v)).join('\n')},
                template: dedent`
                    Files matching glob {{glob}}:

                    \`\`\`
                    {{content}}
                    \`\`\`
                `,
            };
        }

        return {
            type: 'success',
            finished: false,
            executionData: {glob},
            template: 'There are no files matching glob `{{glob}}`.',
        };
    }

    private async executeRegexSearch(args: SearchInWorkspaceParameter, root: string): Promise<ToolExecuteResult> {
        const binaryName = process.platform.startsWith('win') ? 'rg.exe' : 'rg';

        if (!this.commandExecutor.has(binaryName)) {
            return {
                type: 'error',
                finished: false,
                executionData: {},
                template:
                    'User\'s operating system does not have ripgrep (rg) installed, it\'s impossible to search files by regex, please try other methods to locate files, and do not use regex search again.',
            };
        }

        // Reset state for this search
        this.linesCount = 0;
        this.results.length = 0;

        // `rg` automatically respects `.gitignore` so we don't need any special handling of file exclusion
        const regex = args.regex ?? '';
        const commandLineArgs = [
            '-e',
            regex,
            '--context',
            '1',
            '--json',
            args.path ?? '.',
        ];
        if (args.glob) {
            commandLineArgs.push('--glob', args.glob);
        }

        this.logger.trace('ExecuteSearchStart', {args: commandLineArgs});
        const stream = this.commandExecutor.executeStream(
            binaryName,
            commandLineArgs,
            {cwd: root, maxLines: 1000, includeErrorOutput: false}
        );
        await this.consumeRipGrepOutput(stream);

        this.logger.trace(
            'ExecuteSearchFinish',
            {
                regex: args.regex,
                path: args.path,
                glob: args.glob,
                count: this.results.length,
                truncated: this.linesCount >= MAX_LINES,
            }
        );

        return this.constructRegexResponse();
    }

    extractParameters(generated: Record<string, RawToolCallParameter>): Partial<SearchInWorkspaceParameter> {
        return {
            path: asString(generated.path, true),
            glob: asString(generated.glob, true),
            regex: asString(generated.regex, true),
        };
    }

    parseParameters(extracted: Partial<SearchInWorkspaceParameter>): SearchInWorkspaceParameter {
        return {
            path: extracted.path,
            glob: extracted.glob,
            regex: extracted.regex,
        };
    }

    private async consumeRipGrepOutput(stream: AsyncIterable<string>) {
        const state: ConsumeState = {current: null};

        for await (const line of stream) {
            this.linesCount++;
            const item: RipGrepOutputItem = JSON.parse(line);
            if (item.type === 'begin') {
                state.current = {
                    file: item.data.path.text,
                    contextBefore: [],
                    matches: [],
                    contextAfter: [],
                };
                continue;
            }

            if (!state.current) {
                continue;
            }

            if (item.type === 'match') {
                state.current.matches.push(item.data.lines.text);
            }
            else if (item.type === 'context') {
                const container = state.current.matches.length
                    ? state.current.contextAfter
                    : state.current.contextBefore;
                container.push(item.data.lines.text);
            }
            else if (item.type === 'end') {
                this.results.push(state.current);
            }
        }
    }

    private constructRegexResponse(): ToolExecuteResult {
        if (!this.results.length) {
            return {
                type: 'success',
                finished: false,
                executionData: {},
                template: 'There are no files matching this regex pattern.',
            };
        }

        const title = this.linesCount >= MAX_LINES
            ? 'We have too many results for the search, this is some of them, you may use a more accurate search pattern if this output does not satisfy your needs:'
            : 'Search results:';

        // This constructs output into native `grep` style, here is an example:
        //
        // ```
        // packages/shared/src/tool/index.ts-    readFileParameters,
        // packages/shared/src/tool/index.ts-    readDirectoryParameters,
        // packages/shared/src/tool/index.ts:    findFilesByGlobParameters,
        // packages/shared/src/tool/index.ts:    findFilesByRegExpParameters,
        // packages/shared/src/tool/index.ts-    writeFileParameters,
        // packages/shared/src/tool/index.ts-    patchFileParameters,
        // --
        // packages/kernel/src/inbox/workflow.ts-    }
        // packages/kernel/src/inbox/workflow.ts-
        // packages/kernel/src/inbox/workflow.ts:    private findMessageStrict(messageUuid: string) {
        // packages/kernel/src/inbox/workflow.ts:        const message = this.findMessage(messageUuid);
        // packages/kernel/src/inbox/workflow.ts-
        // packages/kernel/src/inbox/workflow.ts-        if (!message) {
        // --
        // packages/shared/src/tool/definition.ts-}
        // packages/shared/src/tool/definition.ts-
        // packages/shared/src/tool/definition.ts:export const findFilesByRegExpParameters = {
        // packages/shared/src/tool/definition.ts-    type: 'object',
        // packages/shared/src/tool/definition.ts-    properties: {
        // ```
        const format = (result: GrepResult) => {
            const lines: string[] = [];
            const file = unixify(result.file);
            // all `line`s are ended with `\n` so we need to trim it
            for (const line of result.contextBefore) {
                lines.push(`${file}-${line.trimEnd()}`);
            }
            for (const line of result.matches) {
                lines.push(`${file}:${line.trimEnd()}`);
            }
            for (const line of result.contextAfter) {
                lines.push(`${file}-${line.trimEnd()}`);
            }
            return lines.join('\n');
        };
        return {
            type: 'success',
            finished: false,
            executionData: {output: this.results.map(format).join('\n--\n')},
            template: dedent`
                ${title}

                \`\`\`
                {{output}}
                \`\`\`
            `,
        };
    }
}
