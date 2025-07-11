import dedent from 'dedent';
import {renderInboxSystemPrompt} from '@oniichan/prompt';
import type {InboxPromptReference, InboxPromptView} from '@oniichan/prompt';
import {stringifyError} from '@oniichan/shared/error';
import {uniqueBy} from '@oniichan/shared/array';
import type {Logger} from '@oniichan/shared/logger';
import {projectRules} from '@oniichan/shared/dir';
import type {EditorHost} from '../../core/editor.js';
import type {ChatRole} from './interface.js';

export interface SystemPromptGeneratorInit {
    role: ChatRole;
    logger: Logger;
    references: InboxPromptReference[];
    editorHost: EditorHost;
}

export class SystemPromptGenerator {
    private role: ChatRole;

    private logger: Logger;

    private references: InboxPromptReference[];

    private editorHost: EditorHost;

    constructor(init: SystemPromptGeneratorInit) {
        this.logger = init.logger.with({source: 'SystemPromptGenerator'});
        this.role = init.role;
        this.references = init.references;
        this.editorHost = init.editorHost;
    }

    async renderSystemPrompt(): Promise<string> {
        const view: InboxPromptView = {
            projectStructure: '',
            projectStructureTruncated: false,
            customRules: '',
            references: [],
            objectiveInstruction: this.role.provideObjective(),
            tools: this.role.provideToolSet(),
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

const objectiveWithoutThinking = dedent`
    You accomplish a given task iteratively, breaking it down into clear steps and working through them methodically.

    1. Analyze the user's task and set clear, achievable goals to accomplish it. Prioritize these goals in a logical order.
    2. Work through these goals sequentially, utilizing available tools one at a time as necessary. Each goal should correspond to a distinct step in your problem-solving process. You will be informed on the work completed and what's remaining as you go.
    3. Remember, you have extensive capabilities with access to a wide range of tools that can be used in powerful and clever ways as necessary to accomplish each goal, choose the most appropriate tool and carefully construct XML style tags to use them.
    4. Once you've completed the user's task, you must use the attempt_completion tool to present the result of the task to the user. You may also provide a CLI command to showcase the result of your task; this can be particularly useful for web development tasks, where you can run e.g. \`open index.html\` to show the website you've built.
    5. When it is not clear to generate cod to satisfy user's request, e.g. some number or string values are not provided from user, do not try to determine by yourself, you should use the ask_followup_question for followup informations.
    6. The user may provide feedback, which you can use to make improvements and try again. But DO NOT continue in pointless back and forth conversations, i.e. don't end your responses with questions or offers for further assistance.

    Your response should almost always formed in this structure:

    1. Some analytics and thoughts in plain text, these information should be exposed to user, so do not put them in your think process, this may includes code edits explained in "Format" section above.
    2. A tool call in a XML-style tag, use the tool name as root tag, carefully put every parameter as an child tag. You MUST use one tool per message, and the tool usage must happen at the end of the message, you should not output anything after a tool call.

    Note in almost every case, except for attempt_completion and ask_followup_question, user would like to see some analyze and introduction text before a tool call, you should not hide them, however no tool name or tool's parameter name is allowed to appear in this part.

    Again, the XML structure of a tool call is critical for the workflow to function correctly, do more thinking about the tool name, parameters and their tag names and nesting structure.
`;

const objectiveWithThinking = dedent`
    You accomplish a given task iteratively, breaking it down into clear steps and working through them methodically.

    1. Analyze the user's task and set clear, achievable goals to accomplish it. Prioritize these goals in a logical order.
    2. Work through these goals sequentially, utilizing available tools one at a time as necessary. Each goal should correspond to a distinct step in your problem-solving process. You will be informed on the work completed and what's remaining as you go.
    3. Remember, you have extensive capabilities with access to a wide range of tools that can be used in powerful and clever ways as necessary to accomplish each goal. Before calling a tool, do some analysis within <thinking></thinking> tags.
        - First, analyze the file structure provided in environment_details to gain context and insights for proceeding effectively.
        - Then, think about which of the provided tools is the most relevant tool to accomplish the user's task.
        - Next, go through each of the required parameters of the relevant tool and determine if the user has directly provided or given enough information to infer a value.
        - When deciding if the parameter can be inferred, carefully consider all the context to see if it supports a specific value.
        - Write out what XML tags are used to construct the tool call, present tags in XML form like \`<read_file\`> and \`<path>\`, only tag names are required inside thinking tag, do not put values here.
        - If all of the required parameters are present or can be reasonably inferred, close the thinking tag and proceed with the tool use.
        - BUT, if one of the values for a required parameter is missing, DO NOT invoke the tool (not even with fillers for the missing params) and instead, ask the user to provide the missing parameters using the ask_followup_question tool.
        - DO NOT ask for more information on optional parameters if it is not provided.
    4. Once you've completed the user's task, you must use the attempt_completion tool to present the result of the task to the user. You may also provide a CLI command to showcase the result of your task; this can be particularly useful for web development tasks, where you can run e.g. \`open index.html\` to show the website you've built.
    5. When it is not clear to generate cod to satisfy user's request, e.g. some number or string values are not provided from user, do not try to determine by yourself, you should use the ask_followup_question for followup informations.
    6. The user may provide feedback, which you can use to make improvements and try again. But DO NOT continue in pointless back and forth conversations, i.e. don't end your responses with questions or offers for further assistance.

    Your response should almost always formed in this structure:

    1. Some analytics and thoughts in plain text, this may includes code edits explained in "Format" section above.
    2. If not using the attempt_completion or ask_followup_question tool, place a <thinking></thinking> tag in which you should think the usage of a tool, it must includes at least the tool name and all its required parameters's value, tool and parameters are expressed in its original names, do not translate them. Carefully explain why and how you are going to use the tool.
    3. A tool call in a XML-style tag, use the tool name as root tag, carefully put every parameter you thought in <thinking></thinkging> as an child tag. You MUST use one tool per message, and the tool usage must happen at the end of the message, you should not output anything after a tool call.

    Note your thoughts inside <thinking></thinking> are required to contain the reason using a tool, a explanation of the tool call XML tag structure is followed, then you call that tool by using the tool name as root tag, each parameter as a child tag, this is a example using read_directory tool:

    \`\`\`
    <thinking>
    I should use the read_directory tool to inspect the structure of project source.

    To call this tool, I need a <read_directory> root element with <path> and <recursive> child tags.
    </thinking>
    <read_directory>
    <path>src</path>
    <recursive>true</recursive>
    </read_directory>
    \`\`\`

    You should always carefully check the XML structure of a tool call with its preceding <thinking></thinking> tag, never loose any parameter tags in tool call.
`;

interface CommonObjectiveOptions {
    requireThinking: boolean;
}

export function renderCommonObjective(options: CommonObjectiveOptions) {
    return options.requireThinking ? objectiveWithThinking : objectiveWithoutThinking;
}
