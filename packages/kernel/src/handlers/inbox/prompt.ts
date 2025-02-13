import {builtinTools} from '@oniichan/shared/tool';
import {InboxPromptView, renderInboxSystemPrompt} from '@oniichan/prompt';
import {DebugContentChunk, DebugMessageLevel} from '@oniichan/shared/inbox';
import {stringifyError} from '@oniichan/shared/error';
import {EditorHost} from '../../editor';

interface DebugResult {
    type: 'debug';
    level: DebugMessageLevel;
    title: string;
    message: DebugContentChunk;
}

interface PromptResult {
    type: 'result';
    prompt: string;
}

export type SystemPromptYieldResult = DebugResult | PromptResult;

export class SystemPromptGenerator {
    private readonly editorHost: EditorHost;

    constructor(editorHost: EditorHost) {
        this.editorHost = editorHost;
    }

    async *renderSystemPrompt(): AsyncIterable<SystemPromptYieldResult> {
        const view: InboxPromptView = {
            tools: [],
            rootEntries: [],
        };

        const toolsView = this.createToolsView();
        Object.assign(view, toolsView);

        try {
            const rootEntriesView = await this.createRootEntriesView();
            Object.assign(view, rootEntriesView);
        }
        catch (ex) {
            yield {
                type: 'debug',
                level: 'error',
                title: 'Read Root Error',
                message: {
                    type: 'plainText',
                    content: stringifyError(ex),
                },
            };
        }

        const systemPrompt = await renderInboxSystemPrompt(view);
        yield {type: 'result', prompt: systemPrompt};
    }

    private createToolsView() {
        return {tools: builtinTools};
    }

    private async createRootEntriesView(): Promise<Partial<InboxPromptView>> {
        const root = await this.editorHost.getWorkspace().getRoot();

        if (root) {
            const entries = await this.editorHost.getWorkspace().readDirectory(root);
            // Entries like `.git` or `.gitignore` are meaningless for code generating
            const meaningfulEntries = entries.filter(v => !v.name.startsWith('.git'));
            return {rootEntries: meaningfulEntries.map(v => v.name + (v.type === 'directory' ? '/' : ''))};
        }

        return {rootEntries: []};
    }
}
