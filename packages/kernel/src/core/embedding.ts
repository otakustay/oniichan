import path from 'node:path';
import {EmbeddingSearchResultItem} from '@oniichan/shared/inbox';
import {now} from '@oniichan/shared/string';
import {EditorHost} from '../editor';
import {CustomConfig} from './config';

interface Position {
    line: number;
    column: number;
}

interface EmbeddingSearchResponseItem {
    repo: string;
    path: string;
    type: string;
    content: string;
    contentStart: Position;
    contentEnd: Position;
    distance: number;
    language: string;
}

interface EmbeddingSearchResponse {
    data: EmbeddingSearchResponseItem[];
}

interface SearchEmbeddingOptions {
    config: CustomConfig;
    editorHost: EditorHost;
}

export async function searchEmbedding(query: string, options: SearchEmbeddingOptions) {
    const {config, editorHost} = options;
    const root = await editorHost.getWorkspace().getRoot();

    if (!root) {
        return [];
    }

    const body = {
        query: [query],
        repo: [config.embeddingRepoId],
        taskId: `knowledge+${now()}`,
    };
    const response = await fetch(
        'https://cs.baidu-int.com/nlcodesearch/v2/multiembeddingsearch',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        }
    );

    const result = await response.json() as EmbeddingSearchResponse;
    const toResultItem = async (item: EmbeddingSearchResponseItem): Promise<EmbeddingSearchResultItem | null> => {
        try {
            const file = path.join(root, item.path.replace(/^\//, ''));
            const text = await editorHost.getWorkspace().readFile(file);
            return {
                file: path.relative(root, file),
                startLine: item.contentStart.line,
                endLine: item.contentEnd.line,
                content: config.embeddingContextMode === 'fullContent'
                    ? text
                    : text.split('\n').slice(item.contentStart.line, item.contentEnd.line + 1).join('\n'),
            };
        }
        catch (ex) {
            console.error(ex);
            return null;
        }
    };
    const source = result.data.filter(v => v.distance >= config.minEmbeddingDistance);
    const items = await Promise.all(source.map(toResultItem));
    return items.filter(v => !!v);
}
