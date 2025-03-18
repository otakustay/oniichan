import {renderInboxSystemPrompt} from '@oniichan/prompt';
import type {InboxPromptReference, InboxPromptView} from '@oniichan/prompt';
import {stringifyError} from '@oniichan/shared/error';
import type {ModelFeature} from '@oniichan/shared/model';
import {uniqueBy} from '@oniichan/shared/array';
import type {Logger} from '@oniichan/shared/logger';
import {projectRules} from '@oniichan/shared/dir';
import type {AssistantRole, MessageThreadWorkingMode} from '@oniichan/shared/inbox';
import type {EditorHost} from '../../core/editor';

export class SystemPromptGenerator {
    private readonly logger: Logger;

    private readonly editorHost: EditorHost;

    private readonly references: InboxPromptReference[] = [];

    private role: AssistantRole = 'standalone';

    private workingMode: MessageThreadWorkingMode = 'normal';

    private modelFeature: ModelFeature = {
        supportReasoning: false,
        requireToolThinking: false,
        shouldAvoidSystemPrompt: false,
    };

    constructor(editorHost: EditorHost, logger: Logger) {
        this.editorHost = editorHost;
        this.logger = logger.with({source: 'SystemPromptGenerator'});
    }

    setAssistantRole(role: AssistantRole) {
        this.role = role;
    }

    setWorkingMode(mode: MessageThreadWorkingMode) {
        this.workingMode = mode;
    }

    setModelFeature(feature: ModelFeature) {
        this.modelFeature = feature;
    }

    addReference(reference: InboxPromptReference[]) {
        this.references.push(...reference);
    }

    async renderSystemPrompt(): Promise<string> {
        const view: InboxPromptView = {
            role: this.role,
            mode: this.workingMode,
            projectStructure: '',
            projectStructureTruncated: false,
            modelFeature: this.modelFeature,
            customRules: '',
            references: [],
        };

        try {
            const rootEntriesView = await this.createProjectStructureView();
            Object.assign(view, rootEntriesView);
        }
        catch (ex) {
            this.logger.warn('ProjectStructureViewFail', {reason: stringifyError(ex)});
        }

        try {
            const rulesView = await this.createRulesView();
            Object.assign(view, rulesView);
        }
        catch (ex) {
            this.logger.warn('CustomRulesViewFail', {reason: stringifyError(ex)});
        }

        view.references = uniqueBy([...view.references, ...this.references], v => `${v.type}:${v.file}`);

        const systemPrompt = await renderInboxSystemPrompt(view);
        return systemPrompt;
    }

    private async createProjectStructureView(): Promise<Partial<InboxPromptView>> {
        const root = await this.editorHost.call('getWorkspaceRoot');

        if (root) {
            const structure = await this.editorHost.call('getWorkspaceStructure');
            return {
                projectStructure: structure.tree,
                projectStructureTruncated: !!structure.truncatedCount,
            };
        }

        return {projectStructure: '', projectStructureTruncated: false};
    }

    private async createRulesView(): Promise<Partial<InboxPromptView>> {
        const content = await this.editorHost.call('readWorkspaceFile', projectRules('default'));
        const guidelineStart = '<!-- Rules Guideline Start -->';
        const guidelineEnd = '<!-- Rules Guideline End -->';

        if (!content || content.includes(guidelineStart) || content.includes(guidelineEnd)) {
            return {customRules: ''};
        }

        const files = [...content.matchAll(/#[^\s]+/g)].map(v => v.at(0)?.slice(1) ?? '').filter(v => !!v);
        const references = await Promise.all(files.map(v => this.readReference(v)));

        return {customRules: content, references: references.filter(v => !!v)};
    }

    private async readReference(file: string): Promise<InboxPromptReference | null> {
        try {
            const content = await this.editorHost.call('readWorkspaceFile', file);
            return content ? {type: 'file', file, content} : null;
        }
        catch (ex) {
            this.logger.warn('ReadReferenceFail', {reason: stringifyError(ex), file});
            return null;
        }
    }
}
