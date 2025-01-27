import path from 'node:path';
import fs from 'node:fs/promises';
import {ToolDescription} from '@oniichan/shared/tool';
import systemPromptTemplate from './system.prompt';
import {renderPrompt} from '@oniichan/shared/prompt';
import {globalConfigDirectory} from '@oniichan/shared/dir';
import {EmbeddingSearchResultItem} from '@oniichan/shared/inbox';
import {CustomConfig} from './config';

async function readUserSystemPrompt() {
    const configDirectory = await globalConfigDirectory();

    if (!configDirectory) {
        return null;
    }

    try {
        return await fs.readFile(path.join(configDirectory, 'system-prompt.md'), 'utf-8');
    }
    catch {
        return null;
    }
}

function uniqueByFile(items: EmbeddingSearchResultItem[]): EmbeddingSearchResultItem[] {
    const uniqueItems: EmbeddingSearchResultItem[] = [];
    const seen = new Set<string>();
    for (const item of items) {
        if (!seen.has(item.file)) {
            uniqueItems.push(item);
            seen.add(item.file);
        }
    }
    return uniqueItems;
}

interface SystemPromptRenderOptions {
    tools: ToolDescription[];
    embeddingSearchResults: EmbeddingSearchResultItem[];
}

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
export async function renderSystemPrompt(options: SystemPromptRenderOptions, config: CustomConfig) {
    const {tools, embeddingSearchResults} = options;
    const view: Record<string, any> = {
        embeddingAsChunk: config.embeddingContextMode === 'chunk'
            ? embeddingSearchResults
            : [],
        embeddingAsFullContent: config.embeddingContextMode === 'fullContent'
            ? uniqueByFile(embeddingSearchResults)
            : [],
        embeddingAsNameOnly: config.embeddingContextMode === 'nameOnly'
            ? uniqueByFile(embeddingSearchResults)
            : [],
        tools: [],
    };
    for (const tool of tools) {
        const toolView: any = {
            name: tool.name,
            description: tool.description,
            parameters: [],
            usage: tool.usage,
        };
        for (const [name, definition] of Object.entries(tool.parameters.properties)) {
            const parameterView = {
                name,
                type: definition.type,
                description: definition.description ?? '',
                required: tool.parameters.required?.includes(name) ?? false,
            };
            toolView.parameters.push(parameterView);
        }
        view.tools.push(toolView);
    }

    const userSystemPrompt = await readUserSystemPrompt();
    return renderPrompt(userSystemPrompt ?? systemPromptTemplate, view);
}
/* eslint-enable @typescript-eslint/no-unsafe-member-access */
