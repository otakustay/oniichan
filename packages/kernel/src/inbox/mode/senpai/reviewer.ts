import dedent from 'dedent';

import type {ChatInputPayload} from '@oniichan/shared/model';
import type {ToolDescription, ToolName} from '@oniichan/shared/tool';
import type {InboxMessage} from '../../interface.js';
import type {ChatRole} from '../interface.js';
import type {ToolImplement, SharedToolName, ToolProviderInit} from '../tool/index.js';
import {pickSharedTools, ToolImplementFactory} from '../tool/index.js';
import {isToolCallMessageOf} from '../../assert.js';
import {RejectReviewToolImplement} from './rejectReview.js';

interface SerializeState {
    context: 'user' | 'actor' | 'reviewer';
}

const tools: SharedToolName[] = [
    'read_file',
    'read_directory',
    'find_files_by_glob',
    'find_files_by_regex',
    'run_command',
    'attempt_completion',
    'ask_followup_question',
];

export class SenpaiReviewerRole implements ChatRole {
    private readonly toolFactory = new ToolImplementFactory();

    constructor() {
        this.toolFactory.registerShared(...tools);
        this.toolFactory.register('ask_followup_question', RejectReviewToolImplement);
    }

    provideModelOverride(): string | undefined {
        return undefined;
    }

    provideToolSet(): ToolDescription[] {
        return pickSharedTools(...tools);
    }

    provideToolImplement(toolName: ToolName, init: ToolProviderInit): ToolImplement {
        return this.toolFactory.create(toolName, init);
    }

    provideObjective(): string {
        return dedent`
            You are designed as a task reviewer, responsible for examining the entire process of task execution and code modifications to ensure that the task is completed with high quality and without causing unexpected errors.

            You cannot edit or modify files within the project, everything you do is to review and assess the quality of task completion, providing further feedback to improve subsequent work.

            Although you may see file edits like \`<write_file>\`, \`<patch_file>\`, etc... you are not allowed to use these tools, you should strictly aligned with tools provided in the "Tool" section.

            You are readonly in ths project strictly, these XML tags are NOT allowed in your response:

            - <write_file>
            - <patch_file>
            - <delete_file>

            When you feel the need to edit a file, it should be a note to instruct the future work inside \`<ask_followup_question>\` tool, you should carefully examine all aspects of the task process, providing more instructions inside a single \`<ask_followup_question>\` call.

            You can actively attempt the following methods for review:

            1. Use the command line to run tasks such as project builds, unit tests, and linting to ensure they can be executed correctly. When a command fails, you should analyze the cause of the error. If the error is not caused by the current modification, you should choose to ignore these errors rather than overcorrecting.
            2. Carefully check file modifications from previous messages, and if necessary, reread the file contents to ensure that code changes meet expectations, the code style is standardized, and the newly added code is of high quality.

            When you believe the task has been successfully and qualitatively completed, you should use the \`<attempt_completion>\` tool to end the current conversation and provide a summary of the task.

            If the task completion is not satisfactory, such as failing to pass builds or unit tests, or if there are defects in the code, you need to use the \`<ask_followup_question>\` tool, posing questions in the \`question\` parameter. Your peers will address these issues subsequently.
        `;
    }

    provideRoleName(): string {
        return 'reviewer';
    }

    provideSerializedMessages(messages: InboxMessage[]): ChatInputPayload[] {
        const serialized: ChatInputPayload[] = [];
        const state: SerializeState = {
            context: 'user',
        };
        for (const message of messages) {
            if (message.type === 'userRequest') {
                state.context = 'user';
                serialized.push(message.toChatInputPayload());
            }
            else if (message.type === 'assistantText' || message.type === 'toolUse') {
                if (state.context !== 'actor') {
                    serialized.push(message.toChatInputPayload());
                }
            }
            else {
                state.context = message.getRole() === 'actor' ? 'actor' : 'reviewer';
                if (state.context === 'reviewer') {
                    serialized.push(message.toChatInputPayload());
                }
                else if (isToolCallMessageOf(message, 'attempt_completion')) {
                    const content = dedent`
                        I've tried to complete this task, this is a summary of actions taken:

                        ${message.findToolCallChunkStrict().arguments.result}
                    `;
                    serialized.push({role: 'assistant', content});
                    state.context = 'reviewer';
                }
            }
        }
        return serialized;
    }
}
