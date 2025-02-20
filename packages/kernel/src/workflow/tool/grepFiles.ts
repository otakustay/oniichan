import unixify from 'unixify';
import {findFilesByRegExpParameters, FindFilesByRegExpParameter} from '@oniichan/shared/tool';
import {stringifyError} from '@oniichan/shared/error';
import {resultMarkdown, ToolImplementBase, ToolImplementInit, ToolRunResult} from './utils';

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

export class GrepFilesToolImplement extends ToolImplementBase<FindFilesByRegExpParameter> {
    private linesCount = 0;

    private readonly results: GrepResult[] = [];

    constructor(init: ToolImplementInit) {
        super('GrepFilesToolImplement', init, findFilesByRegExpParameters);
    }

    protected parseArgs(args: Record<string, string | undefined>) {
        return {
            regex: args.regex,
            path: args.path,
            glob: args.glob,
        };
    }

    protected async execute(args: FindFilesByRegExpParameter): Promise<ToolRunResult> {
        try {
            const root = await this.editorHost.call('getWorkspaceRoot');

            if (!root) {
                return {
                    type: 'success',
                    finished: false,
                    output: 'No open workspace, you cannot read any file or directory now',
                };
            }

            const binaryName = process.platform.startsWith('win') ? 'rg.exe' : 'rg';

            if (!this.commandExecutor.has(binaryName)) {
                return {
                    type: 'executeError',
                    output:
                        'User\'s operating system does not have grep installed, it\'s impossible to search files by regexp, please try other methods to locate files, and do not use this tool again.',
                };
            }

            // `rg` automatically respects `.gitignore` so we don't need any special handling of file exclusion
            const commandLineArgs = [
                '-e',
                args.regex,
                '--context',
                '1',
                '--json',
                args.path,
            ];
            if (args.glob) {
                commandLineArgs.push('--glob', args.glob);
            }
            this.logger.trace('ExecuteGrepStart', {args: commandLineArgs});
            const stream = this.commandExecutor.executeStream(
                binaryName,
                commandLineArgs,
                {cwd: root, maxLines: 1000, includeErrorOutput: false}
            );
            await this.consumeRipGrepOutput(stream);

            this.logger.trace(
                'ExecuteGrepFinish',
                {
                    regex: args.regex,
                    path: args.path,
                    count: this.results.length,
                    truncated: this.linesCount >= MAX_LINES,
                }
            );

            return {
                type: 'success',
                finished: false,
                output: this.constructResponseText(),
            };
        }
        catch (ex) {
            this.logger.error('ExecuteGrepFail', {reason: stringifyError(ex)});
            return {
                type: 'executeError',
                output: `Unable to find files with regex \`${args.regex}\`: ${stringifyError(ex)}`,
            };
        }
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

    private constructResponseText(): string {
        if (!this.results.length) {
            return 'There are no files matching this regex';
        }

        const title = this.linesCount >= MAX_LINES
            ? 'We have too many results for grep, this is some of them, you may use a more accurate search pattern if this output does not satisfy your needs:'
            : 'This is stdout of grep command:';
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
        return resultMarkdown(title, this.results.map(format).join('\n--\n'));
    }
}
