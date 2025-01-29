import path from 'node:path';
import fs from 'node:fs/promises';
import url from 'node:url';
import {builtinTools, ToolDescription} from '@oniichan/shared/tool';
import systemPromptTemplate from './system.prompt';
import {renderPrompt} from '@oniichan/shared/prompt';
import {globalConfigDirectory} from '@oniichan/shared/dir';
import {DebugMessageLevel, EmbeddingSearchResultItem, MessageContentChunk} from '@oniichan/shared/inbox';
import {stringifyError} from '@oniichan/shared/error';
import {assertNever} from '@oniichan/shared/error';
import {CustomConfig} from '../../core/config';
import {EditorHost} from '../../editor';
import {searchEmbedding} from '../../core/embedding';

interface DebugResult {
    type: 'debug';
    level: DebugMessageLevel;
    title: string;
    message: MessageContentChunk;
}

interface PromptResult {
    type: 'result';
    prompt: string;
}

export type SystemPromptYieldResult = DebugResult | PromptResult;

export class SystemPromptGenerator {
    private readonly editorHost: EditorHost;

    private customConfig: CustomConfig;

    constructor(editorHost: EditorHost, customConfig: CustomConfig) {
        this.editorHost = editorHost;
        this.customConfig = customConfig;
    }

    setCustomConfig(config: CustomConfig) {
        this.customConfig = config;
    }

    async *renderSystemPrompt(userRequest: string): AsyncIterable<SystemPromptYieldResult> {
        const view: Record<string, any> = {};

        try {
            const embeddingView = await this.createEmbeddingView(userRequest);
            yield {
                type: 'debug',
                level: 'info',
                title: 'Embedding Search',
                message: {
                    type: 'embeddingSearch',
                    query: userRequest,
                    results: embeddingView.embeddingDataSource,
                },
            };
            Object.assign(view, embeddingView);
        }
        catch (ex) {
            yield {type: 'debug', level: 'error', title: 'Embedding Error', message: stringifyError(ex)};
        }

        const toolsView = this.createToolsView();
        Object.assign(view, toolsView);

        try {
            const rootEntriesView = await this.createRootEntriesView();
            Object.assign(view, rootEntriesView);
        }
        catch (ex) {
            yield {type: 'debug', level: 'error', title: 'Read Root Error', message: stringifyError(ex)};
        }

        const userSystemPrompt = await this.readUserSystemPrompt();
        yield {type: 'result', prompt: renderPrompt(userSystemPrompt ?? systemPromptTemplate, view)};
    }

    private removeDuplicateEmbeddingResult(items: EmbeddingSearchResultItem[]): EmbeddingSearchResultItem[] {
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

    private async readUserSystemPrompt() {
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

    private async applyEmbeddingSearch(query: string): Promise<EmbeddingSearchResultItem[]> {
        if (!this.customConfig.embeddingOnQuery) {
            return [];
        }

        if (!this.customConfig.embeddingRepoId) {
            throw new Error(
                'Embedding search is enabled, but no repo id is provided, please set `embeddingRepoId` in your `.oniichan/config.json` in project root'
            );
        }

        const results = await searchEmbedding(query, {config: this.customConfig, editorHost: this.editorHost});
        return results;
    }

    private async createEmbeddingView(userRequest: string) {
        const view: Record<string, any> = {
            embeddingDataSource: [],
            embeddingAsChunk: [],
            embeddingAsFullContent: [],
            embeddingAsNameOnly: [],
        };

        const embeddingSearchResults = await this.applyEmbeddingSearch(userRequest);
        view.embeddingDataSource = embeddingSearchResults;
        switch (this.customConfig.embeddingContextMode) {
            case 'chunk':
                view.embeddingAsChunk = embeddingSearchResults;
                break;
            case 'fullContent':
                view.embeddingAsFullContent = this.removeDuplicateEmbeddingResult(embeddingSearchResults);
                break;
            case 'nameOnly':
                view.embeddingAsNameOnly = this.removeDuplicateEmbeddingResult(embeddingSearchResults);
                break;
            default:
                assertNever<string>(
                    this.customConfig.embeddingContextMode,
                    v => `Unknown embedding context mode ${v}`
                );
        }

        return view;
    }

    private createToolsView() {
        const isToolEnabled = (tool: ToolDescription) => {
            if (tool.name === 'search_codebase' && !this.customConfig.embeddingAsTool) {
                return false;
            }
            return true;
        };
        const enabledTools = builtinTools.filter(isToolEnabled);
        const tools: any[] = [];
        for (const tool of enabledTools) {
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
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                toolView.parameters.push(parameterView);
            }
            tools.push(toolView);
        }
        return {tools};
    }

    private async createRootEntriesView() {
        const rootEntries: string[] = [];
        if (this.customConfig.rootEntriesOnQuery) {
            const root = await this.editorHost.getWorkspace().getRoot();

            if (root) {
                const entries = await this.editorHost.getWorkspace().readDirectory(url.fileURLToPath(root));
                rootEntries.push(...entries.map(v => v.name + (v.type === 'directory' ? '/' : '')));
            }
        }

        return {rootEntries};
    }
}
