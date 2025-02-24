import {builtinTools} from '@oniichan/shared/tool';
import {InboxPromptView, renderInboxSystemPrompt} from '@oniichan/prompt';
import {stringifyError} from '@oniichan/shared/error';
import {ModelFeature} from '@oniichan/shared/model';
import {EditorHost} from '../../core/editor';
import {Logger} from '@oniichan/shared/logger';

export class SystemPromptGenerator {
    private readonly logger: Logger;

    private readonly editorHost: EditorHost;

    private modelFeature: ModelFeature = {
        supportReasoning: false,
        requireToolThinking: false,
        shouldAvoidSystemPrompt: false,
    };

    constructor(editorHost: EditorHost, logger: Logger) {
        this.editorHost = editorHost;
        this.logger = logger.with({source: 'SystemPromptGenerator'});
    }

    setModelFeature(feature: ModelFeature) {
        this.modelFeature = feature;
    }

    async renderSystemPrompt(): Promise<string> {
        const view: InboxPromptView = {
            tools: [],
            projectStructure: '',
            projectStructureTruncated: false,
            modelFeature: this.modelFeature,
        };

        const toolsView = this.createToolsView();
        Object.assign(view, toolsView);

        try {
            const rootEntriesView = await this.createProjectStructureView();
            Object.assign(view, rootEntriesView);
        }
        catch (ex) {
            this.logger.warn('ProjectStructureViewFail', {reason: stringifyError(ex)});
        }

        const systemPrompt = await renderInboxSystemPrompt(view);
        return systemPrompt;
    }

    private createToolsView() {
        return {tools: builtinTools};
    }

    private async createProjectStructureView(): Promise<Partial<InboxPromptView>> {
        const root = await this.editorHost.call('getWorkspaceRoot');

        if (root) {
            const structure = await this.editorHost.call('getWorkspaceStructure');
            return {
                projectStructure: structure.tree,
                projectStructureTruncated: structure.truncated,
            };
        }

        return {projectStructure: '', projectStructureTruncated: false};
    }
}
