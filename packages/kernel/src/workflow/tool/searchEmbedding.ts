import {searchEmbeddingParameters, SearchEmbeddingParameter} from '@oniichan/shared/tool';
import {stringifyError} from '@oniichan/shared/error';
import {EmbeddingSearchResultItem} from '@oniichan/shared/inbox';
import {EditorHost} from '../../editor';
import {searchEmbedding} from '../../core/embedding';
import {CustomConfig, readCustomConfig} from '../../core/config';
import {ToolImplementBase, ToolRunResult} from './utils';

function formatItem(item: EmbeddingSearchResultItem) {
    const lines = [
        `## ${item.file} line ${item.startLine}-${item.endLine}`,
        '',
        '```',
        item.content.replaceAll('```', '\\`\\`\\`'),
        '```',
    ];
    return lines.join('\n');
}

export class SearchEmbeddingToolImplement extends ToolImplementBase<SearchEmbeddingParameter> {
    constructor(editorHost: EditorHost) {
        super(editorHost, searchEmbeddingParameters);
    }

    protected parseArgs(args: Record<string, string>): SearchEmbeddingParameter {
        return {
            query: args.query,
        };
    }

    protected async execute(args: SearchEmbeddingParameter): Promise<ToolRunResult> {
        const workspace = this.editorHost.getWorkspace();
        try {
            const root = await workspace.getRoot();

            if (!root) {
                return {
                    type: 'success',
                    finished: false,
                    output: 'No open workspace, you cannot read any file or directory now',
                };
            }

            const config: CustomConfig = {
                ...await readCustomConfig(this.editorHost),
                embeddingContextMode: 'chunk',
            };
            const results = await searchEmbedding(args.query, {editorHost: this.editorHost, config});

            if (results.length) {
                const parts = [
                    `Search result for query \`${args.query}\`:`,
                    ...results.map(formatItem),
                ];
                return {
                    type: 'success',
                    finished: false,
                    output: parts.join('\n\n'),
                };
            }

            return {
                type: 'success',
                finished: false,
                output: 'There are no search results for this query',
            };
        }
        catch (ex) {
            return {
                type: 'executeError',
                output: `Unsable to search codebase: ${stringifyError(ex)}`,
            };
        }
    }
}
